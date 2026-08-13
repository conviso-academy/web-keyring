import { mockDelay } from './client';
import { mockAuditLog } from './mock-data';
import type { AuditEntry } from '../types';

export interface AuditFilters {
  vaultId?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  page: number;
  pageSize: number;
}

export async function getAuditLog(filters: AuditFilters): Promise<{ items: AuditEntry[], total: number, page: number }> {
  await mockDelay();
  
  let filtered = [...mockAuditLog];
  
  // No real implementation we'd filter by vaultId by looking up vault names or ids.
  // Here we simplify for the mock if needed.
  
  if (filters.dateStart) {
    filtered = filtered.filter(a => a.timestamp >= filters.dateStart!);
  }
  
  if (filters.dateEnd) {
    const endOfDay = filters.dateEnd + 'T23:59:59Z';
    filtered = filtered.filter(a => a.timestamp <= endOfDay);
  }
  
  const total = filtered.length;
  const start = (filters.page - 1) * filters.pageSize;
  const items = filtered.slice(start, start + filters.pageSize);
  
  return { items, total, page: filters.page };
}
