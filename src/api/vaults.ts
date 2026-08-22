import { apiRequest, mockDelay } from './client';
import { mockVaults, mockSecrets, mockSecretValues, mockAuditLog } from './mock-data';
import type { Vault, Secret, PaginatedResponse } from '../types';

export async function getVaults(page: number = 1, page_size: number = 20): Promise<PaginatedResponse<Vault>> {
  return apiRequest<PaginatedResponse<Vault>>({
    method: 'GET',
    endpoint: '/api/vaults',
    queryParams: { page, page_size }
  });
}

export async function createVault(name: string): Promise<Vault> {
  return apiRequest<Vault>({
    method: 'POST',
    endpoint: '/api/vaults',
    body: { name }
  });
}

export async function getVault(vault_id: string): Promise<Vault> {
  return apiRequest<Vault>({
    method: 'GET',
    endpoint: `/api/vaults/${vault_id}`
  });
}

export async function updateVault(vault_id: string, name: string): Promise<Vault> {
  return apiRequest<Vault>({
    method: 'PUT',
    endpoint: `/api/vaults/${vault_id}`,
    body: { name }
  });
}

export async function deleteVault(vault_id: string, confirm: boolean = false): Promise<void> {
  return apiRequest<void>({
    method: 'DELETE',
    endpoint: `/api/vaults/${vault_id}`,
    queryParams: confirm ? { confirm: true } : undefined
  });
}

export async function getSecrets(vaultId: string): Promise<Secret[]> {
  await mockDelay();
  return mockSecrets.filter(s => s.vault_id === vaultId);
}

export async function revealSecret(id: string): Promise<{ value: string }> {
  await mockDelay();
  const value = mockSecretValues[id];
  if (!value) throw new Error('Secret not found');
  
  // Registrar auditoria
  const secret = mockSecrets.find(s => s.id === id);
  if (secret) {
    const vault = mockVaults.find(v => v.id === secret.vault_id);
    mockAuditLog.unshift({
      id: `a-${Date.now()}`,
      secret_id: id,
      vault_id: vault?.id || null,
      user_email: 'admin@conviso.com',
      action: 'read',
      secret_name: secret.name,
      vault_name: vault?.name || '',
      timestamp: new Date().toISOString(),
      ip_address: '192.168.1.1'
    });
  }
  
  return { value };
}
