from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    TOTPSetupVerifyRequest,
    TOTPVerifyRequest,
    LoginSuccessResponse,
    TOTPSetupResponse,
    LogoutResponse,
    UserPublic
)
from app.services import auth_service, totp_service, session_service
from app.services.audit_service import get_client_ip
from app.dependencies import get_db, get_current_user
from app.core.limiter import limiter
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _set_session_cookie(response: Response, session_id: str):
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="strict",
        max_age=settings.SESSION_MAX_AGE_HOURS * 3600,
        path="/api"
    )

def _clear_session_cookie(response: Response):
    response.delete_cookie(
        key="session_id",
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="strict",
        path="/api"
    )


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=RegisterResponse)
@limiter.limit(settings.RATE_LIMIT_REGISTER)
async def register(
    request: Request,
    payload: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    ip = get_client_ip(request)
    await auth_service.register_user(payload.email, payload.password, ip, db)
    return RegisterResponse()


@router.post("/login", response_model=LoginResponse)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    ip = get_client_ip(request)
    result = await auth_service.login_step1(payload.email, payload.password, ip, db)
    return LoginResponse(
        requires_2fa=result["requires_2fa"],
        requires_2fa_setup=result["requires_2fa_setup"],
        session_token=result["session_token"]
    )


@router.post("/2fa/setup", response_model=TOTPSetupResponse)
@limiter.limit(settings.RATE_LIMIT_2FA)
async def setup_2fa(
    request: Request,
    payload: dict,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    session_token = request.headers.get("X-Session-Token") or payload.get("session_token")
    if not session_token:
        raise HTTPException(status_code=400, detail="session_token é obrigatório")

    token_data = await auth_service.get_pending_token_data(session_token)
    user = await db.get(User, token_data["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    result = await auth_service.setup_2fa(session_token)
    
    provisioning_uri = totp_service.generate_provisioning_uri(result["secret"], user.email)

    return TOTPSetupResponse(
        provisioning_uri=provisioning_uri,
        backup_codes=result["backup_codes"]
    )


@router.post("/2fa/setup/verify", response_model=LoginSuccessResponse)
@limiter.limit(settings.RATE_LIMIT_2FA)
async def verify_2fa_setup(
    request: Request,
    payload: TOTPSetupVerifyRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    ip = get_client_ip(request)
    
    session_token = None
    if payload.session_token:
        session_token = str(payload.session_token)
    if not session_token:
        session_token = request.headers.get("X-Session-Token")
    if not session_token:
         raise HTTPException(status_code=400, detail="session_token é obrigatório")

    user, session = await auth_service.verify_2fa_setup(session_token, payload.code, ip, db)
    
    _set_session_cookie(response, str(session.id))
    
    return LoginSuccessResponse(
        user=UserPublic(
            id=str(user.id),
            email=user.email,
            created_at=user.created_at.isoformat()
        )
    )


@router.post("/2fa/verify", response_model=LoginSuccessResponse)
@limiter.limit(settings.RATE_LIMIT_2FA)
async def verify_2fa(
    request: Request,
    payload: TOTPVerifyRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    ip = get_client_ip(request)
    
    user, session = await auth_service.complete_2fa_verify(
        str(payload.session_token), payload.code, ip, db
    )
    
    _set_session_cookie(response, str(session.id))
    
    return LoginSuccessResponse(
        user=UserPublic(
            id=str(user.id),
            email=user.email,
            created_at=user.created_at.isoformat()
        )
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    response: Response,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session_id_str = request.cookies.get("session_id")
    if session_id_str:
        import uuid
        try:
            session_id = uuid.UUID(session_id_str)
            await session_service.invalidate_session(session_id, db)
            
            # Registrar auditoria
            ip = get_client_ip(request)
            from app.models.enums import AuditAction
            from app.services import audit_service
            await audit_service.log_event(db, current_user.id, AuditAction.logout, ip)
        except ValueError:
            pass

    _clear_session_cookie(response)
    return LogoutResponse()


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserPublic(
        id=str(current_user.id),
        email=current_user.email,
        created_at=current_user.created_at.isoformat()
    )
