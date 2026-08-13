import type { AuditEntry } from '../types';
import { renderActionBadge } from './badge';

export function renderAuditRow(entry: AuditEntry): string {
  const date = new Date(entry.timestamp);
  const formattedDate = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  
  return `
    <tr class="table-row">
      <td class="table-cell" style="color: var(--color-text-secondary); white-space: nowrap;">${formattedDate}</td>
      <td class="table-cell" style="font-weight: 500;">${entry.user_email}</td>
      <td class="table-cell">${renderActionBadge(entry.action)}</td>
      <td class="table-cell">${entry.secret_name} <span style="color: var(--color-text-muted); font-size: 0.8em;">em ${entry.vault_name}</span></td>
    </tr>
  `;
}

export function renderAuditTable(entries: AuditEntry[]): string {
  if (entries.length === 0) return '';
  
  const rows = entries.map(renderAuditRow).join('');
  return `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Segredo</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
