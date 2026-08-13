import { icon } from '../icons';
import type { Vault } from '../types';

export function renderVaultRow(vault: Vault): string {
  const date = new Date(vault.updated_at).toLocaleDateString('pt-BR');
  return `
    <tr class="table-row" style="cursor: pointer;" data-vault-id="${vault.id}">
      <td class="table-cell">
        <div class="flex items-center gap-sm">
          ${icon('lock', 'sm').outerHTML}
          <span style="font-weight: 500;">${vault.name}</span>
        </div>
      </td>
      <td class="table-cell">${vault.secrets_count}</td>
      <td class="table-cell">${date}</td>
      <td class="table-cell table-cell--actions" style="text-align: right;">
        <button class="btn btn--ghost btn--sm btn--icon action-edit" data-id="${vault.id}" title="Editar">
          ${icon('pencil').outerHTML}
        </button>
        <button class="btn btn--ghost btn--sm btn--icon action-delete" data-id="${vault.id}" title="Deletar">
          ${icon('trash').outerHTML}
        </button>
      </td>
    </tr>
  `;
}

export function renderVaultTable(vaults: Vault[]): string {
  if (vaults.length === 0) return '';
  
  const rows = vaults.map(renderVaultRow).join('');
  return `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Segredos</th>
            <th>Atualizado em</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody id="vault-table-body">
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
