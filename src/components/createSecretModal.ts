import { state } from '../state';
import { createSecret } from '../api/vaults';
import { showToast } from './toast';
import { renderSecretsView } from './vaultDetail';
import { openModal } from './modal';
import type { SecretType } from '../types';

const MAX_SECRET_BYTES = 65536;

const TYPE_HINTS: Record<SecretType, string> = {
  api_token: 'Cole o token completo gerado pelo provedor do serviço.',
  db_credential: 'Informe a connection string ou usuário e senha.',
  ssh_key: 'Cole a chave privada completa, incluindo cabeçalhos BEGIN/END.',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function showCreateSecretModal(container: HTMLElement) {
  const vaultName = state.selectedVault?.name ?? '';

  const { body, close } = openModal({
    title: 'Novo Segredo',
    subtitle: `Adicione um valor sensível ao cofre "${vaultName}".`,
    iconName: 'keyRound',
    bodyHTML: `
      <form id="create-secret-form" novalidate>
        <div class="input-group">
          <label class="input-label" for="secret-name">Nome do Segredo</label>
          <input class="input-field" type="text" id="secret-name" required maxlength="255"
                 placeholder="Ex: STRIPE_API_KEY" autocomplete="off" spellcheck="false" />
        </div>
        <div class="input-group">
          <label class="input-label" for="secret-type">Tipo</label>
          <select class="input-field" id="secret-type">
            <option value="api_token">Token de API</option>
            <option value="db_credential">Credencial de Banco</option>
            <option value="ssh_key">Chave SSH</option>
          </select>
          <span class="input-hint" id="secret-type-hint">${TYPE_HINTS.api_token}</span>
        </div>
        <div class="input-group" id="secret-value-group">
          <label class="input-label" for="secret-value">Valor</label>
          <textarea class="input-field input-field--mono" id="secret-value" rows="5" required
                    spellcheck="false" autocomplete="off"></textarea>
          <div class="field-meta">
            <span class="input-hint">Criptografado antes de ser enviado ao servidor.</span>
            <span class="char-counter" id="secret-size-counter">0 B / 64 KB</span>
          </div>
          <span class="input-error-msg" id="secret-size-warning" style="display: none;">O valor excede 64KB.</span>
        </div>
      </form>
    `,
  });

  // Footer com ações
  const modalEl = body.closest('.modal') as HTMLElement;
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button type="button" class="btn btn--ghost" id="btn-cancel-secret">Cancelar</button>
    <button type="submit" form="create-secret-form" class="btn btn--primary" id="btn-submit-secret">Criar Segredo</button>
  `;
  modalEl.appendChild(footer);

  const typeSelect = body.querySelector('#secret-type') as HTMLSelectElement;
  const typeHint = body.querySelector('#secret-type-hint') as HTMLElement;
  typeSelect.addEventListener('change', () => {
    typeHint.textContent = TYPE_HINTS[typeSelect.value as SecretType];
  });

  const valueInput = body.querySelector('#secret-value') as HTMLTextAreaElement;
  const counter = body.querySelector('#secret-size-counter') as HTMLElement;
  const warning = body.querySelector('#secret-size-warning') as HTMLElement;
  const submitBtn = body.closest('.modal')!.querySelector('#btn-submit-secret') as HTMLButtonElement;

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

  body.querySelector('#btn-cancel-secret')?.addEventListener('click', close);

  const form = body.querySelector('#create-secret-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.selectedVault) return;

    const nameInput = body.querySelector('#secret-name') as HTMLInputElement;
    const name = nameInput.value.trim();
    const type = typeSelect.value as SecretType;
    const value = valueInput.value;

    if (!name || !value) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }
    if (new Blob([value]).size > MAX_SECRET_BYTES) {
      showToast('O valor do segredo excede 64KB.', 'error');
      return;
    }

    submitBtn.classList.add('btn--loading');
    submitBtn.disabled = true;

    try {
      await createSecret(state.selectedVault.id, { name, type, value });
      showToast('Segredo criado com sucesso.', 'success');
      close();
      renderSecretsView(container, 1);
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar segredo.', 'error');
      submitBtn.classList.remove('btn--loading');
      submitBtn.disabled = false;
    }
  });
}
