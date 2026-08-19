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
