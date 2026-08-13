import type { User, Vault, Secret, AuditEntry } from '../types';

export const mockUsers: User[] = [
  {
    id: 'u-1',
    email: 'admin@conviso.com',
    created_at: '2026-01-01T00:00:00Z',
  }
];

export const mockVaults: Vault[] = [
  { id: 'v-1', owner_id: 'u-1', name: 'Produção', secrets_count: 12, updated_at: '2026-08-13T10:00:00Z' },
  { id: 'v-2', owner_id: 'u-1', name: 'Staging', secrets_count: 5, updated_at: '2026-08-10T14:30:00Z' },
  { id: 'v-3', owner_id: 'u-1', name: 'Desenvolvimento', secrets_count: 8, updated_at: '2026-08-08T09:15:00Z' }
];

export const mockSecrets: Secret[] = [
  { id: 's-1', vault_id: 'v-1', name: 'AWS Production Key', type: 'api_token', created_by: 'admin@conviso.com', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-08-13T10:00:00Z' },
  { id: 's-2', vault_id: 'v-1', name: 'Prod DB Admin', type: 'db_credential', created_by: 'admin@conviso.com', created_at: '2026-07-05T00:00:00Z', updated_at: '2026-07-05T00:00:00Z' },
  { id: 's-3', vault_id: 'v-1', name: 'Prod Server SSH', type: 'ssh_key', created_by: 'admin@conviso.com', created_at: '2026-07-10T00:00:00Z', updated_at: '2026-07-10T00:00:00Z' },
  
  { id: 's-4', vault_id: 'v-2', name: 'Staging DB', type: 'db_credential', created_by: 'admin@conviso.com', created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 's-5', vault_id: 'v-2', name: 'Staging API Key', type: 'api_token', created_by: 'admin@conviso.com', created_at: '2026-08-02T00:00:00Z', updated_at: '2026-08-10T14:30:00Z' },

  { id: 's-6', vault_id: 'v-3', name: 'Dev DB', type: 'db_credential', created_by: 'admin@conviso.com', created_at: '2026-08-05T00:00:00Z', updated_at: '2026-08-05T00:00:00Z' },
  { id: 's-7', vault_id: 'v-3', name: 'Local Testing Key', type: 'api_token', created_by: 'admin@conviso.com', created_at: '2026-08-06T00:00:00Z', updated_at: '2026-08-08T09:15:00Z' },
];

export const mockSecretValues: Record<string, string> = {
  's-1': 'AKIAIOSFODNN7EXAMPLE',
  's-2': 'prod_db_pass_super_secret_99',
  's-3': '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----',
  's-4': 'staging_db_pass_123',
  's-5': 'STG_898234789234897',
  's-6': 'dev_db_pass',
  's-7': 'DEV_111122223333444',
};

export const mockAuditLog: AuditEntry[] = [
  { id: 'a-1', secret_id: 's-1', user_id: 'u-1', user_email: 'admin@conviso.com', action: 'read', secret_name: 'AWS Production Key', vault_name: 'Produção', timestamp: '2026-08-13T14:30:00Z', ip_address: '192.168.1.1' },
  { id: 'a-2', secret_id: 's-1', user_id: 'u-1', user_email: 'admin@conviso.com', action: 'update', secret_name: 'AWS Production Key', vault_name: 'Produção', timestamp: '2026-08-13T10:00:00Z', ip_address: '192.168.1.1' },
  { id: 'a-3', secret_id: 's-5', user_id: 'u-1', user_email: 'admin@conviso.com', action: 'update', secret_name: 'Staging API Key', vault_name: 'Staging', timestamp: '2026-08-10T14:30:00Z', ip_address: '192.168.1.1' },
  { id: 'a-4', secret_id: 's-7', user_id: 'u-1', user_email: 'admin@conviso.com', action: 'create', secret_name: 'Local Testing Key', vault_name: 'Desenvolvimento', timestamp: '2026-08-06T00:00:00Z', ip_address: '192.168.1.1' },
];
