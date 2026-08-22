import os
import json
import base64
from typing import Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

def _get_aesgcm() -> AESGCM:
    key_str = settings.ENCRYPTION_KEY
    if not key_str:
        raise ValueError("ENCRYPTION_KEY is not set")
    
    try:
        # Tenta decodificar de base64 primeiro
        key_bytes = base64.b64decode(key_str, validate=True)
    except Exception:
        # Fallback: string UTF-8
        key_bytes = key_str.encode("utf-8")
        
    if len(key_bytes) != 32:
        raise ValueError(f"ENCRYPTION_KEY must be exactly 32 bytes for AES-256-GCM, got {len(key_bytes)} bytes")
        
    return AESGCM(key_bytes)

def encrypt(plaintext: bytes) -> bytes:
    aesgcm = _get_aesgcm()
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    return nonce + ciphertext

def decrypt(encrypted: bytes) -> bytes:
    if len(encrypted) < 28:
        raise ValueError("Invalid encrypted data length")
    nonce = encrypted[:12]
    ciphertext = encrypted[12:]
    aesgcm = _get_aesgcm()
    return aesgcm.decrypt(nonce, ciphertext, None)

def encrypt_string(plaintext: str) -> bytes:
    return encrypt(plaintext.encode("utf-8"))

def decrypt_string(encrypted: bytes) -> str:
    return decrypt(encrypted).decode("utf-8")

def encrypt_json(data: Any) -> bytes:
    return encrypt(json.dumps(data).encode("utf-8"))

def decrypt_json(encrypted: bytes) -> Any:
    return json.loads(decrypt(encrypted).decode("utf-8"))
