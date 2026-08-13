import { ensureAppLayout } from '../components/appLayout';
import { state } from '../state';
import { getVaults, getSecrets, revealSecret } from '../api/vaults';
import { renderVaultTable } from '../components/vaultList';
import { renderSecretRow, renderSecretExpansion } from '../components/secretCard';
import { renderEmptyState } from '../components/emptyState';
import { renderSkeleton } from '../components/spinner';
import { showToast } from '../components/toast';
import { showConfirmDialog } from '../components/confirmDialog';
import { icon, setIcon } from '../icons';

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
    renderVaultsView(content);
  }
}

function bindHeaderEvents() {
  document.addEventListener('vaultSearchChange', () => {
    if (!state.selectedVault && state.currentView === 'dashboard') {
      const content = document.getElementById('content');
      if (content) renderVaultsView(content, false);
    }
  }, { once: true }); // Re-bind on next render
}

async function renderVaultsView(container: HTMLElement, fetch = true) {
  if (fetch) {
    container.innerHTML = renderSkeleton();
    try {
      const vaults = await getVaults();
      state.vaults = vaults;
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
      html += renderEmptyState('lock', 'Você ainda não tem nenhum cofre.', 'Criar seu primeiro cofre');
    }
  } else {
    html += renderVaultTable(filtered);
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

  container.querySelectorAll('.action-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      const vault = state.vaults.find(v => v.id === id);
      if (vault) {
        showConfirmDialog(`Tem certeza que deseja excluir o cofre "${vault.name}"?`, () => {
          // Mock delete
          state.vaults = state.vaults.filter(v => v.id !== id);
          showToast('Cofre excluído com sucesso.', 'success');
          renderVaultsView(container, false);
        });
      }
    });
  });
}

async function renderSecretsView(container: HTMLElement) {
  const vault = state.selectedVault!;
  container.innerHTML = renderSkeleton();
  
  try {
    const secrets = await getSecrets(vault.id);
    state.secrets = secrets;
  } catch (e) {
    container.innerHTML = renderEmptyState('alertTriangle', 'Erro ao carregar segredos.', 'Tentar Novamente', () => render());
    return;
  }

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <h2>${vault.name} <span style="color: var(--color-text-secondary); font-size: 1rem; font-weight: normal;">— Segredos</span></h2>
      <button class="btn btn--primary" id="btn-new-secret">
        ${icon('plus', 'sm').outerHTML} Novo Segredo
      </button>
    </div>
  `;

  if (state.secrets.length === 0) {
    html += renderEmptyState('keyRound', 'Este cofre está vazio.', 'Adicionar segredo');
  } else {
    const rows = state.secrets.map(renderSecretRow).join('');
    html += `
      <div class="table-container">
        <table class="table" id="secrets-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Criado por</th>
              <th>Atualizado em</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = html;
  bindSecretEvents(container);
}

function bindSecretEvents(container: HTMLElement) {
  // Handle reveal
  container.querySelectorAll('.action-reveal').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (!id) return;
      
      const tr = (e.currentTarget as HTMLElement).closest('tr');
      if (!tr) return;

      // If already expanded, just close it
      if (state.expandedSecretId === id) {
        state.expandedSecretId = null;
        state.revealedSecretValue = null;
        renderSecretsView(container);
        return;
      }

      state.expandedSecretId = id;
      state.revealedSecretValue = null; // Reset
      
      // We will re-render the secrets view to show the loading expansion,
      // wait for API, then re-render again.
      // But re-rendering the whole view might lose scroll state.
      // For simplicity in vanilla JS, we can manually inject the row or just re-render.
      // Let's manually inject the row to be smoother.
      
      // Remove any existing expansion rows
      container.querySelectorAll('.secret-expansion-row').forEach(el => el.remove());
      container.querySelectorAll('.table-row-expanded').forEach(el => el.classList.remove('table-row-expanded'));
      
      tr.classList.add('table-row-expanded');
      
      const tbody = tr.parentNode;
      const expansionRow = document.createElement('tr');
      expansionRow.className = 'secret-expansion-row';
      expansionRow.innerHTML = `<td colspan="5" style="padding: 0 var(--space-md) var(--space-md); border-bottom: 1px solid var(--color-border-light); background-color: var(--color-bg);"><div style="display: flex; align-items: center; gap: var(--space-sm); color: var(--color-text-secondary);"><div class="btn--loading" style="width: 16px; height: 16px; color: var(--color-accent);"></div>Revelando segredo...</div></td>`;
      
      tbody?.insertBefore(expansionRow, tr.nextSibling);
      
      // Update icon to eye-off
      const iconSpan = btn.querySelector('.icon') as HTMLElement;
      if (iconSpan) {
        setIcon(iconSpan, 'eyeOff');
      }

      try {
        const { value } = await revealSecret(id);
        state.revealedSecretValue = value;
        expansionRow.outerHTML = renderSecretExpansion(id, value, false);
        
        // Rebind copy and close events for the newly injected HTML
        const newExpansion = container.querySelector(`.secret-expansion-row[data-expansion-id="${id}"]`);
        if (newExpansion) {
          newExpansion.querySelector('.action-copy')?.addEventListener('click', () => {
            navigator.clipboard.writeText(value);
            showToast('Copiado para a área de transferência!', 'success');
          });
          newExpansion.querySelector('.action-close-reveal')?.addEventListener('click', () => {
            state.expandedSecretId = null;
            state.revealedSecretValue = null;
            newExpansion.remove();
            tr.classList.remove('table-row-expanded');
            
            // Reset icon
            if (iconSpan) {
              setIcon(iconSpan, 'eye');
            }
          });
        }

      } catch (err: any) {
        showToast('Erro ao revelar segredo', 'error');
        expansionRow.remove();
        tr.classList.remove('table-row-expanded');
      }
    });
  });

  // Delete
  container.querySelectorAll('.action-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      const secret = state.secrets.find(s => s.id === id);
      if (secret) {
        showConfirmDialog(`Tem certeza que deseja excluir o segredo "${secret.name}"?`, () => {
          state.secrets = state.secrets.filter(s => s.id !== id);
          showToast('Segredo excluído com sucesso.', 'success');
          renderSecretsView(container);
        });
      }
    });
  });
}
