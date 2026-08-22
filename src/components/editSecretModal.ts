import { state } from '../state';
import { updateSecret } from '../api/vaults';
import { showToast } from './toast';
import { renderSecretsView } from './vaultDetail';
import { openModal, escapeHtml } from './modal';
import type { Secret, SecretType } from '../types';

const MAX_SECRET_BYTES = 65536;

const TYPE_LABELS: Record<SecretType, string> = {
  api_token: 'Token de API',
  db_credential: 'Credencial de Banco',
  ssh_key: 'Chave SSH',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function showEditSecretModal(container: HTMLElement, secret: Secret) {
  const { body, close } = openModal({
    title: 'Editar Segredo',
    subtitle: `Somente o valor pode ser alterado — uma nova versão será registrada.`,
    iconName: 'pencil',
    bodyHTML: `
      <form id="edit-secret-form" novalidate>
        <div class="input-group">
          <label class="input-label">Nome</label>
          <p class="readonly-value">${escapeHtml(secret.name)}</p>
        </div>
        <div class="input-group">
          <label class="input-label">Tipo</label>
          <p class="readonly-value">${TYPE_LABELS[secret.type] ?? secret.type}</p>
        </div>
        <div class="input-group" id="edit-secret-value-group">
          <label class="input-label" for="edit-secret-value">Novo Valor</label>
          <textarea class="input-field input-field--mono" id="edit-secret-value" rows="5" required
                    spellcheck="false" autocomplete="off"></textarea>
          <div class="field-meta">
            <span class="input-hint">O valor anterior permanece no histórico de versões.</span>
            <span class="char-counter" id="edit-size-counter">0 B / 64 KB</span>
          </div>
          <span class="input-error-msg" id="edit-size-warning" style="display: none;">O valor excede 64KB.</span>
        </div>
      </form>
    `,
  });

  const modalEl = body.closest('.modal') as HTMLElement;
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button type="button" class="btn btn--ghost" id="btn-cancel-edit">Cancelar</button>
    <button type="submit" form="edit-secret-form" class="btn btn--primary" id="btn-submit-edit">Salvar Valor</button>
  `;
  modalEl.appendChild(footer);

  body.querySelector('#btn-cancel-edit')?.addEventListener('click', close);

  const valueInput = body.querySelector('#edit-secret-value') as HTMLTextAreaElement;
  const counter = body.querySelector('#edit-size-counter') as HTMLElement;
  const warning = body.querySelector('#edit-size-warning') as HTMLElement;
  const submitBtn = modalEl.querySelector('#btn-submit-edit') as HTMLButtonElement;

  const updateSize = () => {
    const size = new Blob([valueInput.value]).size;
    counter.textContent = `${formatBytes(size)} / 64 KB`;
    const exceeded = size > MAX_SECRET_BYTES;
    counter.classList.toggle('char-counter--warning', size > MAX_SECRET_BYTES / 2 && !exceeded);
    counter.classList.toggle('char-counter--error', exceeded);
    warning.style.display = exceeded ? 'block' : 'none';
    submitBtn.disabled = exceeded;
  };
  valueInput.addEventListener('input', updateSize);

  const form = body.querySelector('#edit-secret-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.selectedVault) return;

    const value = valueInput.value;

    if (!value) {
      showToast('Informe o novo valor.', 'error');
      return;
    }
    if (new Blob([value]).size > MAX_SECRET_BYTES) {
      showToast('O valor do segredo excede 64KB.', 'error');
      return;
    }

    submitBtn.classList.add('btn--loading');
    submitBtn.disabled = true;

    try {
      await updateSecret(state.selectedVault.id, secret.id, { value });
      showToast('Segredo atualizado com sucesso.', 'success');
      close();
      const currentPage = state.secretsPagination?.page || 1;
      renderSecretsView(container, currentPage);
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar segredo.', 'error');
      submitBtn.classList.remove('btn--loading');
      submitBtn.disabled = false;
    }
  });
}
