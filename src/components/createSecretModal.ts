import { state } from '../state';
import { createSecret } from '../api/vaults';
import { showToast } from './toast';
import { renderSecretsView } from './vaultDetail';
import type { SecretType } from '../types';

export function showCreateSecretModal(container: HTMLElement) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Novo Segredo</h2>
        <button class="modal-close" id="btn-close-secret-modal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="create-secret-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
          <div class="input-group">
            <label class="label" for="secret-name">Nome do Segredo</label>
            <input class="input" type="text" id="secret-name" required />
          </div>
          <div class="input-group">
            <label class="label" for="secret-type">Tipo</label>
            <select class="input" id="secret-type" required>
              <option value="api_token">Token de API</option>
              <option value="db_credential">Credencial de Banco</option>
              <option value="ssh_key">Chave SSH</option>
            </select>
          </div>
          <div class="input-group">
            <label class="label" for="secret-value">Valor</label>
            <textarea class="input" id="secret-value" rows="4" required></textarea>
            <div id="secret-size-warning" style="color: var(--color-danger); font-size: 0.875rem; margin-top: 4px; display: none;">O valor excede 64KB.</div>
          </div>
          <div class="modal-actions" style="margin-top: var(--space-md);">
            <button type="button" class="btn btn--secondary" id="btn-cancel-secret">Cancelar</button>
            <button type="submit" class="btn btn--primary" id="btn-submit-secret">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#btn-close-secret-modal')?.addEventListener('click', close);
  modal.querySelector('#btn-cancel-secret')?.addEventListener('click', close);

  const valueInput = modal.querySelector('#secret-value') as HTMLTextAreaElement;
  const warning = modal.querySelector('#secret-size-warning') as HTMLElement;
  
  valueInput.addEventListener('input', () => {
    const size = new Blob([valueInput.value]).size;
    if (size > 65536) {
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }
  });

  const form = modal.querySelector('#create-secret-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.selectedVault) return;
    
    const name = (modal.querySelector('#secret-name') as HTMLInputElement).value.trim();
    const type = (modal.querySelector('#secret-type') as HTMLSelectElement).value as SecretType;
    const value = valueInput.value;

    if (new Blob([value]).size > 65536) {
      showToast('O valor do segredo excede 64KB.', 'error');
      return;
    }

    const btn = modal.querySelector('#btn-submit-secret') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      await createSecret(state.selectedVault.id, {
        name,
        type,
        value
      });
      showToast('Segredo criado com sucesso.', 'success');
      close();
      renderSecretsView(container, 1);
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar segredo.', 'error');
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  });
}
