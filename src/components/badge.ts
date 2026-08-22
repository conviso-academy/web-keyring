import { icon } from '../icons';
import type { SecretType, AuditAction } from '../types';

export function renderSecretTypeBadge(type: SecretType): string {
  let label = 'Token de API';
  let iconName: 'key' | 'database' | 'terminal' = 'key';

  if (type === 'db_credential') {
    label = 'Credencial de Banco';
    iconName = 'database';
  } else if (type === 'ssh_key') {
    label = 'Chave SSH';
    iconName = 'terminal';
  }
  
  return `
    <span class="badge badge--neutral">
      ${icon(iconName, 'sm').outerHTML} ${label}
    </span>
  `;
}

export function renderActionBadge(action: AuditAction): string {
  const map: Record<AuditAction, { label: string, cls: string }> = {
    'create': { label: 'Segredo Criado', cls: 'badge--success' },
    'read': { label: 'Segredo Lido', cls: 'badge--info' },
    'update': { label: 'Segredo Editado', cls: 'badge--warning' },
    'delete': { label: 'Segredo Excluído', cls: 'badge--error' },
    'login': { label: 'Login', cls: 'badge--neutral' },
    'login_failed': { label: 'Login Falhou', cls: 'badge--error' },
    'logout': { label: 'Logout', cls: 'badge--neutral' },
    'register': { label: 'Cadastro', cls: 'badge--success' },
    '2fa_setup': { label: '2FA Configurado', cls: 'badge--success' },
    '2fa_verify_failed': { label: '2FA Falhou', cls: 'badge--error' },
    'vault_create': { label: 'Cofre Criado', cls: 'badge--success' },
    'vault_update': { label: 'Cofre Editado', cls: 'badge--warning' },
    'vault_delete': { label: 'Cofre Excluído', cls: 'badge--error' }
  };
  
  const config = map[action] || { label: action, cls: 'badge--neutral' };
  return `<span class="badge ${config.cls}">${config.label}</span>`;
}
