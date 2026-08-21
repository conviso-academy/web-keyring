import os
from pathlib import Path
from typing import List

from argon2 import PasswordHasher, exceptions, Type
from app.core.config import settings

# Configuração do Argon2id 
ph = PasswordHasher(
    time_cost=settings.ARGON2_TIME_COST,
    memory_cost=settings.ARGON2_MEMORY_COST,
    parallelism=settings.ARGON2_PARALLELISM,
    hash_len=32,
    salt_len=16,
    type=Type.ID
)

# Dummy hash implementado para evitar ataques de enumeração de usuários
_DUMMY_HASH = ph.hash("dummy_password")

def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return ph.hash(password)

def verify_password(password: str, hash_str: str) -> bool:
    """Verifica se a senha fornecida corresponde ao hash armazenado, usando Argon2id."""
    try:
        ph.verify(hash_str, password)
        return True
    except exceptions.VerifyMismatchError:
        return False
    except exceptions.InvalidHashError:
        return False

def verify_password_dummy() -> None:
    """Executa a verificação de senha dummy para evitar ataques de enumeração de usuários."""
    try:
        ph.verify(_DUMMY_HASH, "dummy_password_wrong")
    except exceptions.VerifyMismatchError:
        pass

# Verifica senhas comuns a partir de um wordlist
_common_passwords = set()
_common_passwords_path = Path(__file__).parent.parent.parent / "data" / "common_passwords.txt"
if _common_passwords_path.exists():
    with open(_common_passwords_path, "r", encoding="utf-8") as f:
        for line in f:
            _common_passwords.add(line.strip().lower())

def validate_password_strength(password: str, email: str) -> List[str]:
    """
    Valida a força da senha com base em critérios de comprimento, conteúdo e senhas comuns.
    """
    errors = []
    
    if len(password) < 12:
        errors.append("A senha deve ter no mínimo 12 caracteres.")
    if len(password) > 128:
        errors.append("A senha deve ter no máximo 128 caracteres.")
        
    local_part = email.split("@")[0].lower()
    if local_part in password.lower():
        errors.append("A senha não deve conter a parte local do seu e-mail.")
        
    if password.lower() in _common_passwords:
        errors.append("Esta senha é muito comum. Por favor, escolha outra.")
        
    return errors
