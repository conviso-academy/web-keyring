import { state } from '../state';
import { getSecrets, revealSecret } from '../api/vaults';
import { renderSecretRow, renderSecretExpansion } from './secretCard';
import { renderEmptyState } from './emptyState';
import { renderSkeleton } from './spinner';
import { showToast } from './toast';
import { showConfirmDialog } from './confirmDialog';
import { icon, setIcon } from '../icons';

export async function renderSecretsView(container: HTMLElement) {
  const vault = state.selectedVault!;
  container.innerHTML = renderSkeleton();
  
  try {
    const secrets = await getSecrets(vault.id);
    state.secrets = secrets;
  } catch (e) {
    container.innerHTML = renderEmptyState('alertTriangle', 'Erro ao carregar segredos.', 'Tentar Novamente', () => {
      import('../views/dashboard').then(({ render }) => render());
    });
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
      
      // Remove qualquer linhas de expansão existentes
      container.querySelectorAll('.secret-expansion-row').forEach(el => el.remove());
      container.querySelectorAll('.table-row-expanded').forEach(el => el.classList.remove('table-row-expanded'));
      
      tr.classList.add('table-row-expanded');
      
      const tbody = tr.parentNode;
      const expansionRow = document.createElement('tr');
      expansionRow.className = 'secret-expansion-row';
      expansionRow.innerHTML = `<td colspan="5" style="padding: 0 var(--space-md) var(--space-md); border-bottom: 1px solid var(--color-border-light); background-color: var(--color-bg);"><div style="display: flex; align-items: center; gap: var(--space-sm); color: var(--color-text-secondary);"><div class="btn--loading" style="width: 16px; height: 16px; color: var(--color-accent);"></div>Revelando segredo...</div></td>`;
      
      tbody?.insertBefore(expansionRow, tr.nextSibling);
      
      const iconSpan = btn.querySelector('.icon') as HTMLElement;
      if (iconSpan) {
        setIcon(iconSpan, 'eyeOff');
      }

      try {
        const { value } = await revealSecret(id);
        state.revealedSecretValue = value;
        expansionRow.outerHTML = renderSecretExpansion(id, value, false);
        
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

  // Deletar
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
