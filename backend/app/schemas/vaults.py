from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class VaultCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Name cannot be empty or just spaces')
        return v

class VaultUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Name cannot be empty or just spaces')
        return v

class VaultResponse(BaseModel):
    id: str
    name: str
    secrets_count: int
    created_at: str | datetime
    updated_at: Optional[str | datetime] = None

class VaultDetailResponse(VaultResponse):
    pass
