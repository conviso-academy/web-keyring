from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID

class AuditFilters(BaseModel):
    vault_id: Optional[UUID] = None
    action: Optional[str] = None
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)

class AuditEntryResponse(BaseModel):
    id: str
    secret_id: Optional[str] = None
    vault_id: Optional[str] = None
    user_email: str
    action: str
    secret_name: Optional[str] = None
    vault_name: Optional[str] = None
    timestamp: str | datetime
    ip_address: str
