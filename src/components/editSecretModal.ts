import { state } from '../state';
import { updateSecret } from '../api/vaults';
import { showToast } from './toast';
import { renderSecretsView } from './vaultDetail';
import type { Secret } from '../types';

export function showEditSecretModal(container: HTMLElement, secret: Secret) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Editar Segredo</h2>
        <button class="modal-close" id="btn-close-edit-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: var(--space-md);">
          <strong>Nome:</strong> ${secret.name} <br/>
          <strong>Tipo:</strong> ${secret.type}
        </div>
        <form id="edit-secret-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
          <div class="input-group">
            <label class="label" for="edit-secret-value">Novo Valor</label>
            <textarea class="input" id="edit-secret-value" rows="4" required></textarea>
            <div id="edit-size-warning" style="color: var(--color-danger); font-size: 0.875rem; margin-top: 4px; display: none;">O valor excede 64KB.</div>
          </div>
          <div class="input-group">
            <label class="label" for="edit-secret-tags">Tags (separadas por vírgula)</label>
            <input class="input" type="text" id="edit-secret-tags" />
          </div>
          <div class="modal-actions" style="margin-top: var(--space-md);">
            <button type="button" class="btn btn--secondary" id="btn-cancel-edit">Cancelar</button>
            <button type="submit" class="btn btn--primary" id="btn-submit-edit">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#btn-close-edit-modal')?.addEventListener('click', close);
  modal.querySelector('#btn-cancel-edit')?.addEventListener('click', close);

  const valueInput = modal.querySelector('#edit-secret-value') as HTMLTextAreaElement;
  const warning = modal.querySelector('#edit-size-warning') as HTMLElement;
  
  valueInput.addEventListener('input', () => {
    const size = new Blob([valueInput.value]).size;
    if (size > 65536) {
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }
  });

  const form = modal.querySelector('#edit-secret-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.selectedVault) return;
    
    const value = valueInput.value;
    const tagsInput = (modal.querySelector('#edit-secret-tags') as HTMLInputElement).value;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    if (new Blob([value]).size > 65536) {
      showToast('O valor do segredo excede 64KB.', 'error');
      return;
    }

    const btn = modal.querySelector('#btn-submit-edit') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      await updateSecret(state.selectedVault.id, secret.id, {
        value,
        tags
      });
      showToast('Segredo atualizado com sucesso.', 'success');
      close();
      const currentPage = state.secretsPagination?.page || 1;
      renderSecretsView(container, currentPage);
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar segredo.', 'error');
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  });
}
