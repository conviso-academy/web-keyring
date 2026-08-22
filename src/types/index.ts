// ─── Enums e Tipos Base ─────────────────────────────────────────

export type SecretType = 'password' | 'note' | 'api_key' | 'api_token' | 'db_credential' | 'ssh_key';

export type AuditAction =
  | 'create' | 'read' | 'update' | 'delete'        // Secrets
  | 'login' | 'login_failed' | 'logout' | 'register' // Auth
  | '2fa_setup' | '2fa_verify_failed'                 // 2FA
  | 'vault_create' | 'vault_update' | 'vault_delete'; // Vaults

// ─── Entidades Principais ───────────────────────────────────────

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Vault {
  id: string;
  name: string;
  secrets_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface VaultDetail extends Vault {
  // Preparado para extensões futuras (ex: permissões, tags)
}

export interface Secret {
  id: string;
  vault_id: string;
  name: string;
  type: SecretType;
  created_by: string;        // Email do criador (via JOIN com users)
  created_at: string;
  updated_at: string | null;
}

export interface SecretReveal {
  value: string;              // Valor em texto plano, descriptografado pelo backend
}

export interface SecretVersion {
  version_number: number;
  created_by: string;         // Email do autor da versão
  created_at: string;
}

export interface AuditEntry {
  id: string;
  secret_id: string | null;
  vault_id: string | null;
  user_email: string;
  action: AuditAction;
  secret_name: string | null;   // null se segredo foi deletado
  vault_name: string | null;    // null se vault foi deletado
  timestamp: string;
  ip_address: string;
}

// ─── Respostas Paginadas ────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── Requests ───────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  requires_2fa: boolean;
  requires_2fa_setup: boolean;
  session_token: string;
}

export interface TwoFaSetupResponse {
  provisioning_uri: string;
  backup_codes: string[];
}

export interface LoginSuccessResponse {
  user: User;
}

export interface VaultCreateRequest {
  name: string;          // 1 a 255 chars, sem espaços vazios
}

export interface VaultUpdateRequest {
  name: string;          // 1 a 255 chars, sem espaços vazios
}

export interface SecretCreateRequest {
  name: string;          // 1 a 255 chars
  type: SecretType;
  value: string;         // 1 char a 64KB (65.536 bytes)
}

export interface SecretUpdateRequest {
  value: string;         // 1 char a 64KB — nome e tipo são imutáveis
}

export interface AuditFilters {
  vault_id?: string;
  action?: AuditAction;
  date_start?: string;   // YYYY-MM-DD
  date_end?: string;     // YYYY-MM-DD
  page?: number;
  page_size?: number;
}

// ─── Respostas de Erro ──────────────────────────────────────────

export interface ErrorResponse {
  detail: string;
}

export interface ConflictResponse {
  detail: string;
  secrets_count: number;
}
