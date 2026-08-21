from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers import auth

app = FastAPI(title="Web-Keyring API")

# 2. Configurar slowapi (Limiter + exception handler)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 4. Adicionar SecurityHeadersMiddlewareS
app.add_middleware(SecurityHeadersMiddleware)

# 3. Adicionar CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Session-Token"],
    expose_headers=[],
    max_age=600,
)

# Adicionar SlowAPIMiddleware
# Starlette executa o último adicionado PRIMEIRO.
# Então a ordem de adição seria:
# 1. SecurityHeadersMiddleware (Roda por ÚLTIMO)
# 2. CORSMiddleware (Roda antes de SecurityHeadersMiddleware)
# 3. SlowAPIMiddleware (Roda PRIMEIRO de todos)
app.add_middleware(SlowAPIMiddleware)

# 5. Incluir router de auth
app.include_router(auth.router)

# 6. Manter health check GET /
@app.get("/")
def read_root():
    return {"message": "Web-Keyring API is running"}
