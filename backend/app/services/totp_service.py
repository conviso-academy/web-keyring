import secrets
import pyotp
from typing import List, Optional

from app.core.config import settings
from app.services import crypto_service

def generate_totp_secret() -> str:
    """Gera um segredo TOTP aleatório de 32 caracteres base32 para o usuário."""
    return pyotp.random_base32(length=32)

def generate_provisioning_uri(secret: str, email: str) -> str:
    """Gera a URI de provisionamento para o aplicativo autenticador, incluindo o nome do usuário e o emissor."""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=settings.TOTP_ISSUER
    )

def verify_totp_code(secret: str, code: str) -> bool:
    """Verifica se o código TOTP fornecido é válido para o segredo dado."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

def generate_backup_codes(count: int = 10) -> List[str]:
    """Gera os códigos de backup para o usuário."""
    
    return [secrets.token_hex(4) for _ in range(count)]

def consume_backup_code(encrypted: bytes, code: str) -> Optional[bytes]:
    """
    Verifica se um código está nos códigos de backup.
    Se estiver, remove-o e retorna a lista atualizada recriptografada.
    Se não estiver, retorna None.
    """
    try:
        codes = crypto_service.decrypt_json(encrypted)
    except Exception:
        return None
        
    if code in codes:
        codes.remove(code)
        return crypto_service.encrypt_json(codes)
    
    return None
