import uuid
from typing import Optional
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.enums import AuditAction

async def log_event(
    db: AsyncSession,
    user_id: uuid.UUID,
    action: AuditAction,
    ip_address: str,
    secret_id: Optional[uuid.UUID] = None,
    vault_id: Optional[uuid.UUID] = None
) -> AuditLog:
    """Log an audit event to the database."""
    
    if ip_address and len(ip_address) > 45:
        ip_address = ip_address[:45]
        
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        ip_address=ip_address,
        secret_id=secret_id,
        vault_id=vault_id
    )
    db.add(audit_log)
    await db.commit()
    await db.refresh(audit_log)
    return audit_log

def get_client_ip(request: Request) -> str:
    """
    Obtenção do IP do cliente a partir do cabeçalho X-Forwarded-For ou do objeto request.client.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Use the first IP in the list
        ip = forwarded.split(",")[0].strip()
        return ip
    
    if request.client and request.client.host:
        return request.client.host
        
    return "0.0.0.0"
