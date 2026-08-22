import { ensureAppLayout } from '../components/appLayout';
import { state } from '../state';
import { getAuditLog } from '../api/audit';
import { getVaults } from '../api/vaults';
import { renderAuditTable } from '../components/auditTable';
import { renderPagination } from '../components/pagination';
import { renderEmptyState } from '../components/emptyState';
import { renderSkeleton } from '../components/spinner';

export async function render(): Promise<void> {
  ensureAppLayout();
  
  const content = document.getElementById('content')!;
  
  // Update header for audit view
  const mainArea = document.querySelector('.main-area')!;
  const oldHeader = document.getElementById('top-header');
  if (oldHeader) {
    const { renderHeader } = await import('../components/header');
    mainArea.replaceChild(renderHeader(), oldHeader);
  }

  // Pre-load vaults for filter if needed
  if (state.vaults.length === 0) {
    const vaultsResp = await getVaults();
    state.vaults = vaultsResp.items;
  }

  renderFiltersAndTable(content);
}

import { AuditAction } from '../types';

async function renderFiltersAndTable(container: HTMLElement) {
  const auditActions: { value: AuditAction, label: string }[] = [
    { value: 'create', label: 'Segredo: Criado' },
    { value: 'read', label: 'Segredo: Lido (Reveal)' },
    { value: 'update', label: 'Segredo: Atualizado' },
    { value: 'delete', label: 'Segredo: Deletado' },
    { value: 'login', label: 'Auth: Login' },
    { value: 'login_failed', label: 'Auth: Login Falhou' },
    { value: 'logout', label: 'Auth: Logout' },
    { value: 'register', label: 'Auth: Cadastro' },
    { value: '2fa_setup', label: 'Auth: 2FA Setup' },
    { value: '2fa_verify_failed', label: 'Auth: 2FA Falhou' },
    { value: 'vault_create', label: 'Cofre: Criado' },
    { value: 'vault_update', label: 'Cofre: Atualizado' },
    { value: 'vault_delete', label: 'Cofre: Deletado' }
  ];

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <h2>Trilha de Auditoria</h2>
    </div>
    
    <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-lg); background: var(--color-surface); padding: var(--space-md); border-radius: var(--radius-md); border: 1px solid var(--color-border-light); flex-wrap: wrap;">
      <div class="input-group" style="margin-bottom: 0; min-width: 200px; flex: 1;">
        <label class="input-label" for="filter-vault">Filtrar por Cofre</label>
        <select id="filter-vault" class="input-field">
          <option value="">Todos os Cofres</option>
          ${state.vaults.map(v => `<option value="${v.id}" ${state.auditFilterVaultId === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}
        </select>
      </div>
      <div class="input-group" style="margin-bottom: 0; min-width: 200px; flex: 1;">
        <label class="input-label" for="filter-action">Ação</label>
        <select id="filter-action" class="input-field">
          <option value="">Todas as Ações</option>
          ${auditActions.map(a => `<option value="${a.value}" ${state.auditFilterAction === a.value ? 'selected' : ''}>${a.label}</option>`).join('')}
        </select>
      </div>
      <div class="input-group" style="margin-bottom: 0; flex: 1; min-width: 150px;">
        <label class="input-label" for="filter-date-start">Data Início</label>
        <input type="date" id="filter-date-start" class="input-field" value="${state.auditFilterDateStart || ''}">
      </div>
      <div class="input-group" style="margin-bottom: 0; flex: 1; min-width: 150px;">
        <label class="input-label" for="filter-date-end">Data Fim</label>
        <input type="date" id="filter-date-end" class="input-field" value="${state.auditFilterDateEnd || ''}">
      </div>
    </div>
    
    <div id="audit-table-container">
      ${renderSkeleton()}
    </div>
  `;

  bindFilterEvents(container);
  
  await fetchAndRenderTable(container.querySelector('#audit-table-container')!);
}

function bindFilterEvents(container: HTMLElement) {
  const vaultSelect = container.querySelector('#filter-vault') as HTMLSelectElement;
  const actionSelect = container.querySelector('#filter-action') as HTMLSelectElement;
  const dateStart = container.querySelector('#filter-date-start') as HTMLInputElement;
  const dateEnd = container.querySelector('#filter-date-end') as HTMLInputElement;
  
  const applyFilters = () => {
    state.auditFilterVaultId = vaultSelect.value || null;
    state.auditFilterAction = actionSelect.value || null;
    state.auditFilterDateStart = dateStart.value || null;
    state.auditFilterDateEnd = dateEnd.value || null;
    state.auditPage = 1; // reset page on filter
    fetchAndRenderTable(container.querySelector('#audit-table-container')!);
  };
  
  vaultSelect.addEventListener('change', applyFilters);
  actionSelect.addEventListener('change', applyFilters);
  dateStart.addEventListener('change', applyFilters);
  dateEnd.addEventListener('change', applyFilters);
}

async function fetchAndRenderTable(tableContainer: HTMLElement) {
  tableContainer.innerHTML = renderSkeleton();
  
  try {
    const res = await getAuditLog({
      vaultId: state.auditFilterVaultId,
      action: state.auditFilterAction as AuditAction,
      dateStart: state.auditFilterDateStart,
      dateEnd: state.auditFilterDateEnd,
      page: state.auditPage,
      pageSize: 20
    });
    
    state.auditEntries = res.items;
    state.auditTotalPages = res.total_pages || 1;
    state.auditPagination = {
      total: res.total,
      page: res.page,
      page_size: res.page_size,
      total_pages: res.total_pages
    };
    
    if (state.auditEntries.length === 0) {
      tableContainer.innerHTML = renderEmptyState('scrollText', 'Nenhum registro de auditoria encontrado.', 'Limpar Filtros', () => {
        state.auditFilterVaultId = null;
        state.auditFilterAction = null;
        state.auditFilterDateStart = null;
        state.auditFilterDateEnd = null;
        state.auditPage = 1;
        render(); // re-render whole view to update inputs
      });
      
      const btn = tableContainer.querySelector('#empty-state-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          state.auditFilterVaultId = null;
          state.auditFilterAction = null;
          state.auditFilterDateStart = null;
          state.auditFilterDateEnd = null;
          state.auditPage = 1;
          render();
        });
      }
      
    } else {
      let html = renderAuditTable(state.auditEntries);
      html += renderPagination(state.auditPage, state.auditTotalPages);
      tableContainer.innerHTML = html;
      
      // Bind pagination
      tableContainer.querySelector('.pagination-prev')?.addEventListener('click', () => {
        if (state.auditPage > 1) {
          state.auditPage--;
          fetchAndRenderTable(tableContainer);
        }
      });
      
      tableContainer.querySelector('.pagination-next')?.addEventListener('click', () => {
        if (state.auditPage < state.auditTotalPages) {
          state.auditPage++;
          fetchAndRenderTable(tableContainer);
        }
      });
    }
  } catch (e) {
    tableContainer.innerHTML = renderEmptyState('alertTriangle', 'Erro ao carregar auditoria.', 'Tentar Novamente', () => fetchAndRenderTable(tableContainer));
    const btn = tableContainer.querySelector('#empty-state-btn');
    if (btn) btn.addEventListener('click', () => fetchAndRenderTable(tableContainer));
  }
}
