export type SecretType = 'api_token' | 'db_credential' | 'ssh_key';
export type AuditAction = 'create' | 'read' | 'update' | 'delete';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Vault {
  id: string;
  owner_id: string;
  name: string;
  secrets_count: number;
  updated_at: string;
}

export interface Secret {
  id: string;
  vault_id: string;
  name: string;
  type: SecretType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  secret_id: string | null;
  user_id: string;
  user_email: string;
  action: AuditAction;
  secret_name: string;
  vault_name: string;
  timestamp: string;
  ip_address: string;
}
