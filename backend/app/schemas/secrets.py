from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from enum import Enum

class SecretType(str, Enum):
    api_token = "api_token"
    db_credential = "db_credential"
    ssh_key = "ssh_key"

class SecretCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: SecretType
    value: str = Field(..., min_length=1, max_length=65536)

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Name cannot be empty or just spaces')
        return v

class SecretUpdateRequest(BaseModel):
    value: str = Field(..., min_length=1, max_length=65536)

class SecretResponse(BaseModel):
    id: str
    vault_id: str
    name: str
    type: str
    created_by: str
    created_at: str | datetime
    updated_at: Optional[str | datetime] = None

class SecretRevealResponse(BaseModel):
    value: str

class SecretVersionResponse(BaseModel):
    version_number: int
    created_by: str
    created_at: str | datetime
