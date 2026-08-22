import type { Vault } from '../types';
import { createVault, updateVault } from '../api/vaults';
import { showToast } from './toast';
import { render } from '../views/dashboard';
import { openModal, escapeHtml } from './modal';

export function showEditVaultModal(vault?: Vault): void {
  const isEdit = Boolean(vault);

  const { body, close } = openModal({
    title: isEdit ? 'Editar Cofre' : 'Novo Cofre',
    subtitle: isEdit
      ? 'Atualize o nome do cofre.'
      : 'Crie um cofre para organizar os segredos da equipe.',
    iconName: isEdit ? 'pencil' : 'database',
    size: 'sm',
    bodyHTML: `
      <form id="vault-form" novalidate>
        <div class="input-group">
          <label class="input-label" for="vault-name">Nome do Cofre</label>
          <input type="text" id="vault-name" class="input-field" required maxlength="255"
                 value="${escapeHtml(vault?.name || '')}"
                 placeholder="Ex: Produção" autocomplete="off" spellcheck="false" />
        </div>
      </form>
    `,
  });

  const modalEl = body.closest('.modal') as HTMLElement;
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const btnText = isEdit ? 'Salvar Alterações' : 'Criar Cofre';
  footer.innerHTML = `
    <button type="button" class="btn btn--ghost" id="vault-cancel">Cancelar</button>
    <button type="submit" form="vault-form" class="btn btn--primary" id="vault-submit">${btnText}</button>
  `;
  modalEl.appendChild(footer);

  body.querySelector('#vault-cancel')?.addEventListener('click', close);

  const form = body.querySelector('#vault-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = body.querySelector('#vault-name') as HTMLInputElement;
    const name = input.value.trim();
    if (!name) {
      showToast('Informe um nome para o cofre.', 'error');
      return;
    }

    const submitBtn = modalEl.querySelector('#vault-submit') as HTMLButtonElement;
    submitBtn.classList.add('btn--loading');
    submitBtn.disabled = true;

    try {
      if (isEdit && vault) {
        await updateVault(vault.id, name);
        showToast('Cofre atualizado com sucesso!', 'success');
      } else {
        await createVault(name);
        showToast('Cofre criado com sucesso!', 'success');
      }
      close();
      render();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar cofre.', 'error');
      submitBtn.classList.remove('btn--loading');
      submitBtn.disabled = false;
    }
  });
}
