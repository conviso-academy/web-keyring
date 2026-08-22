import uuid
import math
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, delete
from sqlalchemy.orm import joinedload
from app.models.vault import Vault
from app.models.secret import Secret
from app.models.secret_version import SecretVersion
from app.schemas.secrets import (
    SecretCreateRequest,
    SecretUpdateRequest,
    SecretResponse,
    SecretRevealResponse,
    SecretVersionResponse,
)
from app.schemas.common import PaginatedResponse
from app.services.audit_service import log_event
from app.models.enums import AuditAction
from app.services.crypto_service import encrypt_string, decrypt_string
from app.core.config import settings

async def _validate_vault_and_secret(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    secret_id: Optional[uuid.UUID] = None
) -> Optional[Secret]:
    vault_stmt = select(Vault).where(
        Vault.id == vault_id,
        Vault.deleted_at.is_(None)
    )
    vault = await db.scalar(vault_stmt)
    if not vault or vault.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault não encontrado"
        )
    
    if secret_id:
        secret_stmt = select(Secret).options(joinedload(Secret.creator)).where(
            Secret.id == secret_id,
            Secret.vault_id == vault_id,
            Secret.deleted_at.is_(None)
        )
        secret = await db.scalar(secret_stmt)
        if not secret:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Secret não encontrado"
            )
        return secret
    return None

async def list_secrets(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    page: int,
    page_size: int
) -> PaginatedResponse[SecretResponse]:
    await _validate_vault_and_secret(db, user_id, vault_id)
    
    offset = (page - 1) * page_size
    stmt = select(Secret).options(joinedload(Secret.creator)).where(
        Secret.vault_id == vault_id,
        Secret.deleted_at.is_(None)
    ).order_by(Secret.name.asc()).limit(page_size).offset(offset)
    
    result = await db.execute(stmt)
    secrets = result.scalars().all()
    
    count_stmt = select(func.count()).select_from(Secret).where(
        Secret.vault_id == vault_id,
        Secret.deleted_at.is_(None)
    )
    total = await db.scalar(count_stmt)
    
    items = [
        SecretResponse(
            id=str(s.id),
            vault_id=str(s.vault_id),
            name=s.name,
            type=s.type.value,
            created_by=s.creator.email,
            created_at=s.created_at,
            updated_at=s.updated_at
        ) for s in secrets
    ]
    
    return PaginatedResponse(
        items=items,
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=math.ceil((total or 0) / page_size) if total else 0
    )

async def create_secret(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    data: SecretCreateRequest,
    ip_address: str
) -> SecretResponse:
    await _validate_vault_and_secret(db, user_id, vault_id)
    
    if len(data.value.encode('utf-8')) > settings.MAX_SECRET_VALUE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Valor excede tamanho máximo"
        )
        
    encrypted_value = encrypt_string(data.value)
    
    secret = Secret(
        vault_id=vault_id,
        name=data.name,
        type=data.type,
        encrypted_value=encrypted_value,
        created_by=user_id
    )
    
    db.add(secret)
    await db.commit()
    await db.refresh(secret)
    
    # We need to reload to get the creator's email
    secret = await _validate_vault_and_secret(db, user_id, vault_id, secret.id)
    
    await log_event(
        db=db,
        user_id=user_id,
        action=AuditAction.create,
        ip_address=ip_address,
        secret_id=secret.id,
        vault_id=vault_id
    )
    
    return SecretResponse(
        id=str(secret.id),
        vault_id=str(secret.vault_id),
        name=secret.name,
        type=secret.type.value,
        created_by=secret.creator.email,
        created_at=secret.created_at,
        updated_at=secret.updated_at
    )

async def get_secret(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID
) -> SecretResponse:
    secret = await _validate_vault_and_secret(db, user_id, vault_id, secret_id)
    return SecretResponse(
        id=str(secret.id),
        vault_id=str(secret.vault_id),
        name=secret.name,
        type=secret.type.value,
        created_by=secret.creator.email,
        created_at=secret.created_at,
        updated_at=secret.updated_at
    )

async def update_secret(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID,
    data: SecretUpdateRequest,
    ip_address: str
) -> SecretResponse:
    secret = await _validate_vault_and_secret(db, user_id, vault_id, secret_id)
    
    if len(data.value.encode('utf-8')) > settings.MAX_SECRET_VALUE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Valor excede tamanho máximo"
        )
        
    version_stmt = select(func.max(SecretVersion.version_number)).where(
        SecretVersion.secret_id == secret.id
    )
    max_version = await db.scalar(version_stmt)
    next_version = (max_version or 0) + 1
    
    secret_version = SecretVersion(
        secret_id=secret.id,
        encrypted_value=secret.encrypted_value,
        version_number=next_version,
        created_by=user_id
    )
    db.add(secret_version)
    
    count_versions_stmt = select(func.count()).select_from(SecretVersion).where(
        SecretVersion.secret_id == secret.id
    )
    versions_count = await db.scalar(count_versions_stmt)
    
    if versions_count is not None and versions_count >= settings.MAX_SECRET_VERSIONS:
        oldest_stmt = select(SecretVersion.id).where(
            SecretVersion.secret_id == secret.id
        ).order_by(SecretVersion.version_number.asc()).limit(1)
        oldest_id = await db.scalar(oldest_stmt)
        if oldest_id:
            del_stmt = delete(SecretVersion).where(SecretVersion.id == oldest_id)
            await db.execute(del_stmt)
            
    secret.encrypted_value = encrypt_string(data.value)
    await db.commit()
    await db.refresh(secret)
    
    await log_event(
        db=db,
        user_id=user_id,
        action=AuditAction.update,
        ip_address=ip_address,
        secret_id=secret.id,
        vault_id=vault_id
    )
    
    return SecretResponse(
        id=str(secret.id),
        vault_id=str(secret.vault_id),
        name=secret.name,
        type=secret.type.value,
        created_by=secret.creator.email,
        created_at=secret.created_at,
        updated_at=secret.updated_at
    )

async def delete_secret(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID,
    ip_address: str
):
    secret = await _validate_vault_and_secret(db, user_id, vault_id, secret_id)
    secret.deleted_at = func.now()
    await db.commit()
    
    await log_event(
        db=db,
        user_id=user_id,
        action=AuditAction.delete,
        ip_address=ip_address,
        secret_id=secret.id,
        vault_id=vault_id
    )

async def reveal_secret(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID
) -> SecretRevealResponse:
    secret = await _validate_vault_and_secret(db, user_id, vault_id, secret_id)
    
    try:
        plaintext = decrypt_string(secret.encrypted_value)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao descriptografar o segredo"
        )
        
    return SecretRevealResponse(value=plaintext)

async def list_secret_versions(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID
) -> list[SecretVersionResponse]:
    secret = await _validate_vault_and_secret(db, user_id, vault_id, secret_id)
    
    stmt = select(SecretVersion).options(joinedload(SecretVersion.creator)).where(
        SecretVersion.secret_id == secret.id
    ).order_by(SecretVersion.version_number.desc())
    
    result = await db.execute(stmt)
    versions = result.scalars().all()
    
    return [
        SecretVersionResponse(
            version_number=v.version_number,
            created_by=v.creator.email,
            created_at=v.created_at
        ) for v in versions
    ]
