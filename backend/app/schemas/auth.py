import os
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, model_validator
from uuid import UUID



class RegisterRequest(BaseModel):
    email: EmailStr = Field(max_length=320)
    password: str = Field(min_length=12, max_length=128)

    @model_validator(mode="after")
    def normalize_email(self):
        self.email = self.email.lower()
        return self


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=320)
    password: str = Field(max_length=128)

    @model_validator(mode="after")
    def normalize_email(self):
        self.email = self.email.lower()
        return self


class TOTPVerifyRequest(BaseModel):
    code: str = Field(pattern=r"^(\d{6}|[a-fA-F0-9]{8})$")
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
