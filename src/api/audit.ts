import { apiRequest } from './client';
import type { AuditEntry, PaginatedResponse, AuditAction } from '../types';

export interface AuditFilters {
  vaultId?: string | null;
  action?: AuditAction | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  page: number;
  pageSize: number;
}

export async function getAuditLog(filters: AuditFilters): Promise<PaginatedResponse<AuditEntry>> {
  const queryParams: Record<string, string | number> = {
    page: filters.page,
    page_size: filters.pageSize
  };
  
  if (filters.vaultId) queryParams.vault_id = filters.vaultId;
  if (filters.action) queryParams.action = filters.action;
  if (filters.dateStart) queryParams.date_start = filters.dateStart;
  if (filters.dateEnd) queryParams.date_end = filters.dateEnd;

  return apiRequest<PaginatedResponse<AuditEntry>>({
    method: 'GET',
    endpoint: '/api/audit-log',
    queryParams
  });
}
