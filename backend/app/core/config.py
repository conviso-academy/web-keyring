from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str
    ENCRYPTION_KEY: str
    SECRET_KEY: str
    SESSION_MAX_AGE_HOURS: int
    ARGON2_TIME_COST: int
    ARGON2_MEMORY_COST: int
    ARGON2_PARALLELISM: int
    ENVIRONMENT: str
    DEBUG: bool

    # CORS
    CORS_ALLOWED_ORIGINS: str
    
    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "3/minute"
    RATE_LIMIT_2FA: str = "5/minute"
    
    # Bloqueio de Conta
    MAX_FAILED_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15
    
    # TOTP
    TOTP_ISSUER: str = "Web-Keyring"
    TOTP_DIGITS: int = 6
    TOTP_INTERVAL: int = 30
    
    # Token Temporário de 2FA
    TWO_FA_TOKEN_TTL_MINUTES: int = 5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
