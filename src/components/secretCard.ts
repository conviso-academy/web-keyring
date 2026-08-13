import { icon } from '../icons';
import type { Secret } from '../types';
import { renderSecretTypeBadge } from './badge';
import { state } from '../state';

export function renderSecretRow(secret: Secret): string {
  const date = new Date(secret.updated_at).toLocaleDateString('pt-BR');
  const isExpanded = state.expandedSecretId === secret.id;
  
  return `
    <tr class="table-row ${isExpanded ? 'table-row-expanded' : ''}" data-secret-id="${secret.id}">
      <td class="table-cell" style="font-weight: 500;">${secret.name}</td>
      <td class="table-cell">${renderSecretTypeBadge(secret.type)}</td>
      <td class="table-cell" style="color: var(--color-text-secondary);">${secret.created_by}</td>
      <td class="table-cell">${date}</td>
      <td class="table-cell table-cell--actions" style="text-align: right;">
        <button class="btn btn--ghost btn--sm btn--icon action-reveal" data-id="${secret.id}" title="Revelar">
          ${icon('eye').outerHTML}
        </button>
        <button class="btn btn--ghost btn--sm btn--icon action-edit" data-id="${secret.id}" title="Editar">
          ${icon('pencil').outerHTML}
        </button>
        <button class="btn btn--ghost btn--sm btn--icon action-delete" data-id="${secret.id}" title="Deletar">
          ${icon('trash').outerHTML}
        </button>
      </td>
    </tr>
  `;
}

export function renderSecretExpansion(secretId: string, value: string | null, isLoading: boolean): string {
  let content = '';
  
  if (isLoading) {
    content = `
      <div style="display: flex; align-items: center; gap: var(--space-sm); color: var(--color-text-secondary);">
        <div class="btn--loading" style="width: 16px; height: 16px; color: var(--color-accent);"></div>
        Revelando segredo...
      </div>
    `;
  } else {
    content = `
      <div style="display: flex; align-items: center; justify-content: space-between; background-color: var(--color-sidebar); color: white; padding: var(--space-md); border-radius: var(--radius-md);">
        <code class="font-mono" style="font-size: 1rem; word-break: break-all;">${value || '••••••••••••'}</code>
        <div style="display: flex; gap: var(--space-sm);">
          <button class="btn btn--secondary btn--sm action-copy" data-id="${secretId}">
            ${icon('copy', 'sm').outerHTML} Copiar
          </button>
          <button class="btn btn--ghost btn--sm btn--icon action-close-reveal" data-id="${secretId}" style="color: white;">
            ${icon('chevronUp').outerHTML}
          </button>
        </div>
      </div>
    `;
  }

  return `
    <tr class="secret-expansion-row" data-expansion-id="${secretId}">
      <td colspan="5" style="padding: 0 var(--space-md) var(--space-md) var(--space-md); border-bottom: 1px solid var(--color-border-light); background-color: var(--color-bg);">
        ${content}
      </td>
    </tr>
  `;
}
