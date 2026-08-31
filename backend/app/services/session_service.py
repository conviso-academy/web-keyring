import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.session import Session
from app.core.config import settings

async def create_session(user_id: uuid.UUID, db: AsyncSession) -> Session:
    """Cria a sessão do usuário e retorna o objeto Session."""
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.SESSION_MAX_AGE_HOURS)
    
    new_session = Session(
        user_id=user_id,
        expires_at=expires_at
    )
    
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    return new_session

async def validate_session(session_id: uuid.UUID, db: AsyncSession) -> Optional[Session]:
    """Valida se a sessão é válida (não expirada) e retorna o objeto Session, ou None se inválida."""
    stmt = select(Session).where(
        Session.id == session_id,
        Session.expires_at > datetime.now(timezone.utc)
    )
    
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def invalidate_session(session_id: uuid.UUID, db: AsyncSession) -> None:
    """Invalida a sessão do usuário removendo-a do banco de dados."""
    stmt = delete(Session).where(Session.id == session_id)
    await db.execute(stmt)
    await db.commit()

async def cleanup_expired_sessions(db: AsyncSession) -> int:
    """Deleta todas as sessões expiradas e retorna o número de sessões removidas."""
    stmt = delete(Session).where(Session.expires_at <= datetime.now(timezone.utc))
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount
