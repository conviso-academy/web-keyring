import os
import json
import secrets
import pyotp
from typing import List, Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

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

def _get_aesgcm() -> AESGCM:
    key_bytes = settings.ENCRYPTION_KEY.encode("utf-8")
    
    if len(key_bytes) != 32:
        
        key_bytes = key_bytes.ljust(32, b'\0')[:32]
    return AESGCM(key_bytes)

def encrypt_totp_secret(secret: str) -> bytes:
    """Criptografa o segredo TOTP usando AES-256-GCM."""
    aesgcm = _get_aesgcm()
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, secret.encode("utf-8"), None)
    return nonce + ciphertext

def decrypt_totp_secret(encrypted: bytes) -> str:
    """Descriptografa o segredo TOTP usando AES-256-GCM."""
    if len(encrypted) < 12 + 16:
        raise ValueError("Invalid encrypted data length")
    nonce = encrypted[:12]
    ciphertext = encrypted[12:]
    aesgcm = _get_aesgcm()
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")

def encrypt_backup_codes(codes: List[str]) -> bytes:
    """Serializa os códigos de backup para JSON e os criptografa com AES-256-GCM."""
    aesgcm = _get_aesgcm()
    nonce = os.urandom(12)
    data = json.dumps(codes).encode("utf-8")
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return nonce + ciphertext

def decrypt_backup_codes(encrypted: bytes) -> List[str]:
    """Descriptografa os códigos de backup criptografados com AES-256-GCM e os desserializa do JSON."""
    if len(encrypted) < 12 + 16:
        raise ValueError("Invalid encrypted backup codes length")
    nonce = encrypted[:12]
    ciphertext = encrypted[12:]
    aesgcm = _get_aesgcm()
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return json.loads(plaintext.decode("utf-8"))

def consume_backup_code(encrypted: bytes, code: str) -> Optional[bytes]:
    """
    Verifica se um código está nos códigos de backup.
    Se estiver, remove-o e retorna a lista atualizada recriptografada.
    Se não estiver, retorna None.
    """
    try:
        codes = decrypt_backup_codes(encrypted)
    except Exception:
        return None
        
    if code in codes:
        codes.remove(code)
        return encrypt_backup_codes(codes)
    
    return None
