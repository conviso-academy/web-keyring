import { icon } from '../icons';
import type { SecretType, AuditAction } from '../types';

export function renderSecretTypeBadge(type: SecretType): string {
  let label = 'API Token';
  let iconName: 'key' | 'database' | 'terminal' = 'key';
  
  if (type === 'db_credential') {
    label = 'DB Credential';
    iconName = 'database';
  } else if (type === 'ssh_key') {
    label = 'SSH Key';
    iconName = 'terminal';
  }
  
  return `
    <span class="badge badge--neutral">
      ${icon(iconName, 'sm').outerHTML} ${label}
    </span>
  `;
}

export function renderActionBadge(action: AuditAction): string {
  let label = '';
  let cls = '';
  
  if (action === 'create') {
    label = 'Criação';
    cls = 'badge--success';
  } else if (action === 'read') {
    label = 'Leitura';
    cls = 'badge--info';
  } else if (action === 'update') {
    label = 'Atualização';
    cls = 'badge--warning';
  } else if (action === 'delete') {
    label = 'Exclusão';
    cls = 'badge--error';
  }
  
  return `<span class="badge ${cls}">${label}</span>`;
}
