import enum

class SecretType(enum.Enum):
    api_token = "api_token"
    db_credential = "db_credential"
    ssh_key = "ssh_key"

class AuditAction(enum.Enum):
    create = "create"
    read = "read"
    update = "update"
    delete = "delete"
    login = "login"
    login_failed = "login_failed"
    logout = "logout"
    register = "register"
    two_fa_setup = "2fa_setup"
    two_fa_verify_failed = "2fa_verify_failed"
    vault_create = "vault_create"
    vault_update = "vault_update"
    vault_delete = "vault_delete"
