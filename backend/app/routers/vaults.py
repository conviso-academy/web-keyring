from fastapi import APIRouter, Depends, Request, Response, Query, HTTPException, status
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limiter import limiter
from app.core.config import settings
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.enums import AuditAction
from app.schemas.vaults import VaultCreateRequest, VaultUpdateRequest, VaultResponse
from app.schemas.secrets import SecretCreateRequest, SecretUpdateRequest, SecretResponse, SecretRevealResponse, SecretVersionResponse
from app.schemas.common import PaginatedResponse
from app.services import vault_service, secret_service
from app.services.audit_service import log_event, get_client_ip

router = APIRouter(prefix="/api/vaults", tags=["Vaults"])

# --- Vaults ---

@router.get("", response_model=PaginatedResponse[VaultResponse])
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def list_vaults_route(
    request: Request,
    response: Response,
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await vault_service.list_vaults(db, current_user.id, page, page_size)


@router.post("", response_model=VaultResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def create_vault_route(
    request: Request,
    response: Response,
    data: VaultCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ip_address = get_client_ip(request)
    return await vault_service.create_vault(db, current_user.id, data, ip_address)


@router.get("/{vault_id}", response_model=VaultResponse)
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def get_vault_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await vault_service.get_vault(db, current_user.id, vault_id)


@router.put("/{vault_id}", response_model=VaultResponse)
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def update_vault_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    data: VaultUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ip_address = get_client_ip(request)
    return await vault_service.update_vault(db, current_user.id, vault_id, data, ip_address)


@router.delete("/{vault_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def delete_vault_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    confirm: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ip_address = get_client_ip(request)
    await vault_service.delete_vault(db, current_user.id, vault_id, ip_address, confirm)


# --- Secrets ---

@router.get("/{vault_id}/secrets", response_model=PaginatedResponse[SecretResponse])
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def list_secrets_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await secret_service.list_secrets(db, current_user.id, vault_id, page, page_size)


@router.post("/{vault_id}/secrets", response_model=SecretResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def create_secret_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    data: SecretCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ip_address = get_client_ip(request)
    return await secret_service.create_secret(db, current_user.id, vault_id, data, ip_address)


@router.get("/{vault_id}/secrets/{secret_id}", response_model=SecretResponse)
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def get_secret_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await secret_service.get_secret(db, current_user.id, vault_id, secret_id)


@router.put("/{vault_id}/secrets/{secret_id}", response_model=SecretResponse)
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def update_secret_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID,
    data: SecretUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ip_address = get_client_ip(request)
    return await secret_service.update_secret(db, current_user.id, vault_id, secret_id, data, ip_address)


@router.delete("/{vault_id}/secrets/{secret_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def delete_secret_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ip_address = get_client_ip(request)
    await secret_service.delete_secret(db, current_user.id, vault_id, secret_id, ip_address)


@router.get("/{vault_id}/secrets/{secret_id}/reveal", response_model=SecretRevealResponse)
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def reveal_secret_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve plaintext secret from service
    secret_reveal_resp = await secret_service.reveal_secret(db, current_user.id, vault_id, secret_id)
    
    # Audit log
    ip_address = get_client_ip(request)
    try:
        await log_event(
            db=db,
            user_id=current_user.id,
            action=AuditAction.read,
            ip_address=ip_address,
            secret_id=secret_id,
            vault_id=vault_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao registrar auditoria de acesso"
        )
        
    # Explicit anti-cache headers
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    return secret_reveal_resp


@router.get("/{vault_id}/secrets/{secret_id}/versions", response_model=list[SecretVersionResponse])
@limiter.limit(settings.RATE_LIMIT_CRUD)
async def list_secret_versions_route(
    request: Request,
    response: Response,
    vault_id: uuid.UUID,
    secret_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await secret_service.list_secret_versions(db, current_user.id, vault_id, secret_id)
