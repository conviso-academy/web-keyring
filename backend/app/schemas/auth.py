import os
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, model_validator
from uuid import UUID

# Carregar senhas comuns na inicialização
COMMON_PASSWORDS = set()
_pwd_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "common_passwords.txt")
if os.path.exists(_pwd_path):
    with open(_pwd_path, "r", encoding="utf-8") as _f:
        COMMON_PASSWORDS = {line.strip().lower() for line in _f if line.strip()}


class RegisterRequest(BaseModel):
    email: EmailStr = Field(max_length=320)
    password: str = Field(min_length=12, max_length=128)

    @model_validator(mode="after")
    def validate_password_strength_and_normalize(self):
        email_lower = self.email.lower()
        self.email = email_lower
        
        password_lower = self.password.lower()
        email_local_part = email_lower.split("@")[0]
        
        if email_local_part in password_lower:
            raise ValueError("A senha não pode conter a parte local do e-mail")
            
        if password_lower in COMMON_PASSWORDS:
            raise ValueError("A senha escolhida é muito comum ou fraca")
            
        return self


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=320)
    password: str = Field(max_length=128)

    @model_validator(mode="after")
    def normalize_email(self):
        self.email = self.email.lower()
        return self


class TOTPVerifyRequest(BaseModel):
    code: str = Field(pattern=r"^\d{6}$")
    session_token: Optional[UUID] = None
    session_token: UUID


class TOTPSetupVerifyRequest(BaseModel):
    code: str = Field(pattern=r"^\d{6}$")
    session_token: Optional[UUID] = None


class RegisterResponse(BaseModel):
    message: str = "Cadastro processado com sucesso"


class LoginResponse(BaseModel):
    requires_2fa: bool
    requires_2fa_setup: bool
    session_token: Optional[str] = None


class UserPublic(BaseModel):
    id: str
    email: str
    created_at: str


class LoginSuccessResponse(BaseModel):
    user: UserPublic


class TOTPSetupResponse(BaseModel):
    provisioning_uri: str
    backup_codes: List[str]


class LogoutResponse(BaseModel):
    message: str = "Sessão encerrada"


class ErrorResponse(BaseModel):
    detail: str
