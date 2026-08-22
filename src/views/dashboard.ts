import { ensureAppLayout } from '../components/appLayout';
import { state } from '../state';
import { getVaults, deleteVault } from '../api/vaults';
import { renderVaultTable } from '../components/vaultList';
import { renderEmptyState } from '../components/emptyState';
import { renderSkeleton } from '../components/spinner';
import { showToast } from '../components/toast';
import { showConfirmDialog } from '../components/confirmDialog';
import { icon } from '../icons';
import { renderPagination } from '../components/pagination';
import { showEditVaultModal } from '../components/editVaultModal';
import { renderSecretsView } from '../components/vaultDetail';
import { ConflictError } from '../api/errors';

export function render(): void {
  ensureAppLayout();
  
  const content = document.getElementById('content')!;
  
  // Re-render header to update breadcrumb
  const mainArea = document.querySelector('.main-area')!;
  const oldHeader = document.getElementById('top-header');
  if (oldHeader) {
    import('../components/header').then(({ renderHeader }) => {
      mainArea.replaceChild(renderHeader(), oldHeader);
      bindHeaderEvents();
    });
  }

  // Load data based on state
  if (state.selectedVault) {
    renderSecretsView(content);
  } else {
    
    const page = state.vaultsPagination?.page || 1;
    renderVaultsView(content, true, page);
  }
}

function bindHeaderEvents() {
  document.addEventListener('vaultSearchChange', () => {
    if (!state.selectedVault && state.currentView === 'dashboard') {
      const content = document.getElementById('content');
      
      if (content) renderVaultsView(content, false, 1);
    }
  }, { once: true }); // Re-bind on next render
}

async function renderVaultsView(container: HTMLElement, fetch = true, page = 1) {
  if (fetch) {
    container.innerHTML = renderSkeleton();
    try {
      const paginatedVaults = await getVaults(page);
      state.vaults = paginatedVaults.items;
      state.vaultsPagination = {
        total: paginatedVaults.total,
        page: paginatedVaults.page,
        page_size: paginatedVaults.page_size,
        total_pages: paginatedVaults.total_pages
      };
    } catch (e: any) {
      container.innerHTML = renderEmptyState('alertTriangle', 'Erro ao carregar cofres.', 'Tentar Novamente', () => render());
      return;
    }
  }

  const query = state.vaultSearchQuery.toLowerCase();
  const filtered = state.vaults.filter(v => v.name.toLowerCase().includes(query));

  let html = '';
  
  html += `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <h2>Seus Cofres</h2>
      <button class="btn btn--primary" id="btn-new-vault">
        ${icon('plus', 'sm').outerHTML} Novo Cofre
      </button>
    </div>
  `;

  if (filtered.length === 0) {
    if (query) {
      html += renderEmptyState('search', 'Nenhum cofre encontrado para sua busca.');
    } else {
      html += renderEmptyState('lock', 'Você ainda não tem nenhum cofre.', 'Criar seu primeiro cofre', () => {
        showEditVaultModal();
      });
    }
  } else {
    html += renderVaultTable(filtered);
    
    
    if (state.vaultsPagination && state.vaultsPagination.total_pages > 1) {
      html += renderPagination(state.vaultsPagination.page, state.vaultsPagination.total_pages);
    }
  }

  container.innerHTML = html;
  
  // Bind events
  container.querySelectorAll('.table-row').forEach(row => {
    row.addEventListener('click', (e) => {
      // Ignore if click was on an action button
      if ((e.target as HTMLElement).closest('.btn')) return;
      
      const id = (e.currentTarget as HTMLElement).getAttribute('data-vault-id');
      if (id) {
        state.selectedVault = state.vaults.find(v => v.id === id) || null;
        render();
      }
    });
  });

  const btnNewVault = container.querySelector('#btn-new-vault');
  if (btnNewVault) {
    btnNewVault.addEventListener('click', () => {
      showEditVaultModal();
    });
  }
  
  // Edit
  container.querySelectorAll('.action-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      const vault = state.vaults.find(v => v.id === id);
      if (vault) {
        showEditVaultModal(vault);
      }
    });
  });

  // Delete
  container.querySelectorAll('.action-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      const vault = state.vaults.find(v => v.id === id);
      if (vault) {
        showConfirmDialog(`Tem certeza que deseja excluir o cofre "${vault.name}"?`, async () => {
          try {
            await deleteVault(vault.id);
            showToast('Cofre excluído com sucesso.', 'success');
            // Re-fetch current page or page 1 if current page becomes empty? For simplicity just re-render current page
            renderVaultsView(container, true, state.vaultsPagination?.page || 1);
          } catch (err: any) {
            if (err instanceof ConflictError || err.name === 'ConflictError') {
              // Show another confirmation dialog for recursive delete
              const countSuffix = typeof err.secretsCount === 'number' ? ` Ele contém ${err.secretsCount} segredo(s).` : '';
              showConfirmDialog(`Este cofre contém segredos.${countSuffix} Deseja excluir tudo?`, async () => {
                try {
                  await deleteVault(vault.id, true);
                  showToast('Cofre e segredos excluídos com sucesso.', 'success');
                  renderVaultsView(container, true, state.vaultsPagination?.page || 1);
                } catch (delErr: any) {
                  showToast(delErr.message || 'Erro ao excluir cofre.', 'error');
                }
              });
            } else {
              showToast(err.message || 'Erro ao excluir cofre.', 'error');
            }
          }
        });
      }
    });
  });

  const prevBtn = container.querySelector('.pagination-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.vaultsPagination && state.vaultsPagination.page > 1) {
        renderVaultsView(container, true, state.vaultsPagination.page - 1);
      }
    });
  }
  
  const nextBtn = container.querySelector('.pagination-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.vaultsPagination && state.vaultsPagination.page < state.vaultsPagination.total_pages) {
        renderVaultsView(container, true, state.vaultsPagination.page + 1);
      }
    });
  }
}
