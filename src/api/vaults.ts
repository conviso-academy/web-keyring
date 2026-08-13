import { mockDelay } from './client';
import { mockVaults, mockSecrets, mockSecretValues, mockAuditLog } from './mock-data';
import type { Vault, Secret } from '../types';

export async function getVaults(): Promise<Vault[]> {
  await mockDelay();
  return [...mockVaults];
}

export async function createVault(name: string): Promise<Vault> {
  await mockDelay();
  const newVault: Vault = {
    id: `v-${Date.now()}`,
    owner_id: 'u-1',
    name,
    secrets_count: 0,
    updated_at: new Date().toISOString()
  };
  mockVaults.push(newVault);
  return newVault;
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
      user_id: 'u-1',
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
