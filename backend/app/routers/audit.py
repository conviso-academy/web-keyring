import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload

from app.core.limiter import limiter
from app.core.config import settings
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.secret import Secret
from app.models.vault import Vault
from app.schemas.audit import AuditEntryResponse
from app.schemas.common import PaginatedResponse
from app.models.enums import AuditAction

router = APIRouter(prefix="/api/audit", tags=["Audit Log"])

@router.get("", response_model=PaginatedResponse[AuditEntryResponse])
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def list_audit_logs_route(
    request: Request,
    vault_id: Optional[str] = None,
    action: Optional[AuditAction] = None,
    date_start: Optional[date] = None,
    date_end: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * page_size
    
    conditions = [AuditLog.user_id == current_user.id]
    
    if vault_id:
        conditions.append(AuditLog.vault_id == vault_id)
    if action:
        conditions.append(AuditLog.action == action)
    if date_start:
        conditions.append(func.date(AuditLog.created_at) >= date_start)
    if date_end:
        conditions.append(func.date(AuditLog.created_at) <= date_end)
        
    where_clause = and_(*conditions)
    
    # Query logs with joins to get secret_name, vault_name, user_email
    stmt = (
        select(AuditLog)
        .options(
            joinedload(AuditLog.user),
            joinedload(AuditLog.vault),
            joinedload(AuditLog.secret)
        )
        .where(where_clause)
        .order_by(AuditLog.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    count_stmt = select(func.count()).select_from(AuditLog).where(where_clause)
    total = await db.scalar(count_stmt)
    
    items = []
    for log in logs:
        # Note: joinedload might return models with sensitive info. 
        # AuditEntryResponse only takes names and email.
        items.append(AuditEntryResponse(
            id=str(log.id),
            secret_id=str(log.secret_id) if log.secret_id else None,
            vault_id=str(log.vault_id) if log.vault_id else None,
            user_email=log.user.email if log.user else "",
            action=log.action.value,
            secret_name=log.secret.name if log.secret else None,
            vault_name=log.vault.name if log.vault else None,
            timestamp=log.created_at,
            ip_address=log.ip_address
        ))
        
    return PaginatedResponse(
        items=items,
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=math.ceil((total or 0) / page_size) if total else 0
    )
