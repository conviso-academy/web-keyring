import uuid
import math
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.models.vault import Vault
from app.models.secret import Secret
from app.schemas.vaults import VaultCreateRequest, VaultUpdateRequest, VaultResponse
from app.schemas.common import PaginatedResponse
from app.services.audit_service import log_event
from app.models.enums import AuditAction

async def list_vaults(
    db: AsyncSession,
    user_id: uuid.UUID,
    page: int,
    page_size: int
) -> PaginatedResponse[VaultResponse]:
    offset = (page - 1) * page_size
    
    stmt = select(Vault).where(
        Vault.owner_id == user_id,
        Vault.deleted_at.is_(None)
    ).order_by(Vault.name.asc()).limit(page_size).offset(offset)
    
    result = await db.execute(stmt)
    vaults = result.scalars().all()
    
    count_stmt = select(func.count()).select_from(Vault).where(
        Vault.owner_id == user_id,
        Vault.deleted_at.is_(None)
    )
    total = await db.scalar(count_stmt)
    
    items = []
    for v in vaults:
        secret_count_stmt = select(func.count()).select_from(Secret).where(
            Secret.vault_id == v.id,
            Secret.deleted_at.is_(None)
        )
        secrets_count = await db.scalar(secret_count_stmt)
        
        recent_secret_stmt = select(Secret.updated_at).where(
            Secret.vault_id == v.id,
            Secret.deleted_at.is_(None),
            Secret.updated_at.is_not(None)
        ).order_by(Secret.updated_at.desc()).limit(1)
        recent_updated = await db.scalar(recent_secret_stmt)
        
        items.append(VaultResponse(
            id=str(v.id),
            name=v.name,
            secrets_count=secrets_count or 0,
            created_at=v.created_at,
            updated_at=recent_updated
        ))
        
    return PaginatedResponse(
        items=items,
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=math.ceil((total or 0) / page_size) if total else 0
    )

async def create_vault(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: VaultCreateRequest,
    ip_address: str
) -> VaultResponse:
    stmt = select(Vault).where(
        Vault.owner_id == user_id,
        Vault.name == data.name,
        Vault.deleted_at.is_(None)
    )
    existing = await db.scalar(stmt)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um vault com este nome"
        )
        
    vault = Vault(
        owner_id=user_id,
        name=data.name
    )
    db.add(vault)
    await db.commit()
    await db.refresh(vault)
    
    await log_event(
        db=db,
        user_id=user_id,
        action=AuditAction.vault_create,
        ip_address=ip_address,
        vault_id=vault.id
    )
    
    return VaultResponse(
        id=str(vault.id),
        name=vault.name,
        secrets_count=0,
        created_at=vault.created_at,
        updated_at=None
    )

async def get_vault(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID
) -> VaultResponse:
    stmt = select(Vault).where(
        Vault.id == vault_id,
        Vault.deleted_at.is_(None)
    )
    vault = await db.scalar(stmt)
    
    if not vault or vault.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault não encontrado"
        )
        
    secret_count_stmt = select(func.count()).select_from(Secret).where(
        Secret.vault_id == vault.id,
        Secret.deleted_at.is_(None)
    )
    secrets_count = await db.scalar(secret_count_stmt)
    
    recent_secret_stmt = select(Secret.updated_at).where(
        Secret.vault_id == vault.id,
        Secret.deleted_at.is_(None),
        Secret.updated_at.is_not(None)
    ).order_by(Secret.updated_at.desc()).limit(1)
    recent_updated = await db.scalar(recent_secret_stmt)
        
    return VaultResponse(
        id=str(vault.id),
        name=vault.name,
        secrets_count=secrets_count or 0,
        created_at=vault.created_at,
        updated_at=recent_updated
    )

async def update_vault(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    data: VaultUpdateRequest,
    ip_address: str
) -> VaultResponse:
    stmt = select(Vault).where(
        Vault.id == vault_id,
        Vault.deleted_at.is_(None)
    )
    vault = await db.scalar(stmt)
    
    if not vault or vault.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault não encontrado"
        )
        
    check_name_stmt = select(Vault).where(
        Vault.owner_id == user_id,
        Vault.name == data.name,
        Vault.id != vault_id,
        Vault.deleted_at.is_(None)
    )
    existing = await db.scalar(check_name_stmt)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um vault com este nome"
        )
        
    vault.name = data.name
    await db.commit()
    await db.refresh(vault)
    
    await log_event(
        db=db,
        user_id=user_id,
        action=AuditAction.vault_update,
        ip_address=ip_address,
        vault_id=vault.id
    )
    
    return await get_vault(db, user_id, vault_id)

async def delete_vault(
    db: AsyncSession,
    user_id: uuid.UUID,
    vault_id: uuid.UUID,
    ip_address: str,
    confirm: bool = False
):
    stmt = select(Vault).where(
        Vault.id == vault_id,
        Vault.deleted_at.is_(None)
    )
    vault = await db.scalar(stmt)
    
    if not vault or vault.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault não encontrado"
        )
        
    secret_count_stmt = select(func.count()).select_from(Secret).where(
        Secret.vault_id == vault.id,
        Secret.deleted_at.is_(None)
    )
    secrets_count = await db.scalar(secret_count_stmt)
    
    if (secrets_count or 0) > 0 and not confirm:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Este vault contém {secrets_count} secret(s). Adicione ?confirm=true para confirmar a deleção."
        )
        
    vault.deleted_at = func.now()
    
    if (secrets_count or 0) > 0:
        update_secrets_stmt = (
            update(Secret)
            .where(Secret.vault_id == vault.id, Secret.deleted_at.is_(None))
            .values(deleted_at=func.now())
        )
        await db.execute(update_secrets_stmt)
        
    await db.commit()
    
    await log_event(
        db=db,
        user_id=user_id,
        action=AuditAction.vault_delete,
        ip_address=ip_address,
        vault_id=vault.id
    )
