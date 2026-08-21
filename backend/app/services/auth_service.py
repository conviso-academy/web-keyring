import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.totp_device import TOTPDevice
from app.models.session import Session
from app.models.enums import AuditAction
from app.core.config import settings

from app.services import password_service, session_service, totp_service, audit_service

_pending_2fa_tokens: Dict[str, Dict[str, Any]] = {}
_token_lock = asyncio.Lock()

async def _cleanup_expired_tokens():
    """Remove tokens expirados do dicionário em memória."""
    now = datetime.now(timezone.utc)
    async with _token_lock:
        expired_keys = [
            k for k, v in _pending_2fa_tokens.items() 
            if v["expires_at"] <= now
        ]
        for k in expired_keys:
            del _pending_2fa_tokens[k]

async def register_user(email: str, password: str, ip: str, db: AsyncSession) -> None:
    email = email.lower().strip()
    
    # 2. Validar força da senha
    errors = password_service.validate_password_strength(password, email)
    if errors:
        raise HTTPException(status_code=422, detail=" ".join(errors))
        
    # 3. Hash da senha
    hashed_password = password_service.hash_password(password)
    
    # 4. Verificar se email já existe
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        # 5. Se existe: descartar hash e retornar (anti-enumeração)
        return
        
    # 6. Se não existe: INSERT User, registrar audit_log
    new_user = User(
        email=email,
        password_hash=hashed_password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    await audit_service.log_event(
        db=db,
        user_id=new_user.id,
        action=AuditAction.register,
        ip_address=ip
    )

async def login_step1(email: str, password: str, ip: str, db: AsyncSession) -> dict:
    email = email.lower().strip()
    
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        password_service.verify_password_dummy()
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
    is_locked = user.locked_until and user.locked_until > datetime.now(timezone.utc)
        
    is_valid = password_service.verify_password(password, user.password_hash)
    
    if is_locked:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
    if not is_valid:
        user.failed_attempts += 1
        if user.failed_attempts >= settings.MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
        
        await db.commit()
        await audit_service.log_event(db, user.id, AuditAction.login_failed, ip)
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
    # Senha válida
    user.failed_attempts = 0
    user.locked_until = None
    await db.commit()
    
    # Checa se o usuário tem 2FA configurado
    stmt_totp = select(TOTPDevice).where(TOTPDevice.user_id == user.id)
    result_totp = await db.execute(stmt_totp)
    totp_device = result_totp.scalar_one_or_none()
    
    requires_2fa_setup = totp_device is None or not totp_device.is_verified
    requires_2fa = not requires_2fa_setup
    
    # Gerar token temporário para 2FA
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.TWO_FA_TOKEN_TTL_MINUTES)
    
    async with _token_lock:
        _pending_2fa_tokens[session_token] = {
            "user_id": user.id,
            "expires_at": expires_at
        }
    
    # Limpar tokens expirados em background
    asyncio.create_task(_cleanup_expired_tokens())
    
    return {
        "requires_2fa": requires_2fa,
        "requires_2fa_setup": requires_2fa_setup,
        "session_token": session_token
    }

async def get_pending_token_data(session_token: str) -> dict:
    """Obtém os dados do token temporário de 2FA, garantindo que ele ainda seja válido."""
    await _cleanup_expired_tokens()
    async with _token_lock:
        token_data = _pending_2fa_tokens.get(session_token)
        if not token_data:
            raise HTTPException(status_code=401, detail="Token expirado ou inválido")
        return token_data

async def setup_2fa(session_token: str) -> dict:
    token_data = await get_pending_token_data(session_token)
    
    secret = totp_service.generate_totp_secret()
    backup_codes = totp_service.generate_backup_codes(10)
    
    async with _token_lock:
        _pending_2fa_tokens[session_token]["temp_secret"] = secret
        _pending_2fa_tokens[session_token]["temp_backup_codes"] = backup_codes
        
    return {
        "secret": secret,
        "backup_codes": backup_codes
    }

async def verify_2fa_setup(session_token: str, code: str, ip: str, db: AsyncSession) -> Tuple[User, Session]:
    token_data = await get_pending_token_data(session_token)
    user_id = token_data["user_id"]
    temp_secret = token_data.get("temp_secret")
    temp_backup_codes = token_data.get("temp_backup_codes")
    
    if not temp_secret or not temp_backup_codes:
        raise HTTPException(status_code=400, detail="Setup não iniciado")
        
    if not totp_service.verify_totp_code(temp_secret, code):
        await audit_service.log_event(db, user_id, AuditAction.two_fa_verify_failed, ip)
        raise HTTPException(status_code=401, detail="Código inválido")
        
    
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
    # Remove dispositivos TOTP antigos, se existirem
    stmt_delete = select(TOTPDevice).where(TOTPDevice.user_id == user_id)
    old_device = (await db.execute(stmt_delete)).scalar_one_or_none()
    if old_device:
        await db.delete(old_device)
        await db.commit()
        
    encrypted_secret = totp_service.encrypt_totp_secret(temp_secret)
    encrypted_backups = totp_service.encrypt_backup_codes(temp_backup_codes)
    
    device = TOTPDevice(
        user_id=user_id,
        encrypted_secret=encrypted_secret,
        encrypted_backup_codes=encrypted_backups,
        is_verified=True,
        last_used_at=datetime.now(timezone.utc)
    )
    db.add(device)
    await db.commit()
    
    # Criar sessão e registrar evento de auditoria
    session = await session_service.create_session(user_id, db)
    await audit_service.log_event(db, user_id, AuditAction.two_fa_setup, ip)
    
    # Consume token
    async with _token_lock:
        _pending_2fa_tokens.pop(session_token, None)
        
    return user, session

async def complete_2fa_verify(session_token: str, code: str, ip: str, db: AsyncSession) -> Tuple[User, Session]:
    token_data = await get_pending_token_data(session_token)
    user_id = token_data["user_id"]
    
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Token expirado ou inválido")
        
    stmt_totp = select(TOTPDevice).where(TOTPDevice.user_id == user_id)
    totp_device = (await db.execute(stmt_totp)).scalar_one_or_none()
    
    if not totp_device or not totp_device.is_verified:
        raise HTTPException(status_code=400, detail="2FA não configurado")
        
    secret = totp_service.decrypt_totp_secret(totp_device.encrypted_secret)
    
    is_valid = False
    
    if totp_service.verify_totp_code(secret, code):
        is_valid = True
    elif totp_device.encrypted_backup_codes:
        new_encrypted_backups = totp_service.consume_backup_code(totp_device.encrypted_backup_codes, code)
        if new_encrypted_backups:
            is_valid = True
            totp_device.encrypted_backup_codes = new_encrypted_backups
            
    if not is_valid:
        await audit_service.log_event(db, user_id, AuditAction.two_fa_verify_failed, ip)
        raise HTTPException(status_code=401, detail="Código inválido")
        
    # Sucesso: atualizar last_used_at, criar sessão, registrar evento de auditoria
    totp_device.last_used_at = datetime.now(timezone.utc)
    await db.commit()
    
    session = await session_service.create_session(user_id, db)
    await audit_service.log_event(db, user_id, AuditAction.login, ip)
    
    # Usar token
    async with _token_lock:
        _pending_2fa_tokens.pop(session_token, None)
        
    return user, session
