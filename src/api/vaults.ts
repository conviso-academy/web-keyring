import { apiRequest } from './client';
import type { Vault, Secret, PaginatedResponse, SecretCreateRequest, SecretUpdateRequest, SecretVersion } from '../types';

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

export async function getSecrets(vault_id: string, page: number = 1, page_size: number = 20): Promise<PaginatedResponse<Secret>> {
  return apiRequest<PaginatedResponse<Secret>>({
    method: 'GET',
    endpoint: `/api/vaults/${vault_id}/secrets`,
    queryParams: { page, page_size }
  });
}

export async function createSecret(vault_id: string, request: SecretCreateRequest & { tags?: string[] }): Promise<Secret> {
  return apiRequest<Secret>({
    method: 'POST',
    endpoint: `/api/vaults/${vault_id}/secrets`,
    body: request
  });
}

export async function getSecret(vault_id: string, secret_id: string): Promise<Secret> {
  return apiRequest<Secret>({
    method: 'GET',
    endpoint: `/api/vaults/${vault_id}/secrets/${secret_id}`
  });
}

export async function updateSecret(vault_id: string, secret_id: string, request: SecretUpdateRequest & { tags?: string[] }): Promise<Secret> {
  return apiRequest<Secret>({
    method: 'PUT',
    endpoint: `/api/vaults/${vault_id}/secrets/${secret_id}`,
    body: request
  });
}

export async function deleteSecret(vault_id: string, secret_id: string): Promise<void> {
  return apiRequest<void>({
    method: 'DELETE',
    endpoint: `/api/vaults/${vault_id}/secrets/${secret_id}`
  });
}

export async function revealSecret(vault_id: string, secret_id: string, version?: number): Promise<{ value: string }> {
  return apiRequest<{ value: string }>({
    method: 'GET',
    endpoint: `/api/vaults/${vault_id}/secrets/${secret_id}/reveal`,
    queryParams: version !== undefined ? { version } : undefined
  });
}

export async function getSecretVersions(vault_id: string, secret_id: string): Promise<SecretVersion[]> {
  return apiRequest<SecretVersion[]>({
    method: 'GET',
    endpoint: `/api/vaults/${vault_id}/secrets/${secret_id}/versions`
  });
}
