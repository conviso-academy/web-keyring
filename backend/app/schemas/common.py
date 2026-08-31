from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, Field

T = TypeVar('T')

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

class ErrorResponse(BaseModel):
    detail: str

class ConflictResponse(BaseModel):
    detail: str
    secrets_count: int
