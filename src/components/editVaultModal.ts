import type { Vault } from '../types';
import { createVault, updateVault } from '../api/vaults';
import { showToast } from './toast';
import { render } from '../views/dashboard';

export function showEditVaultModal(vault?: Vault): void {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  
  overlay.innerHTML = '';
  
  const card = document.createElement('div');
  card.className = 'card';
  card.style.maxWidth = '400px';
  card.style.width = '100%';
  
  const title = vault ? 'Editar Cofre' : 'Novo Cofre';
  const btnText = vault ? 'Salvar' : 'Criar';
  
  card.innerHTML = `
    <h3 style="margin-bottom: var(--space-md);">${title}</h3>
    <form id="vault-form">
      <div class="form-group">
        <label class="form-label" for="vault-name">Nome do Cofre</label>
        <input type="text" id="vault-name" class="form-input" required value="${vault?.name || ''}" placeholder="Ex: Produção" />
      </div>
      <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-xl);">
        <button type="button" class="btn btn--ghost" id="vault-cancel">Cancelar</button>
        <button type="submit" class="btn btn--primary" id="vault-submit">${btnText}</button>
      </div>
    </form>
  `;
  
  overlay.appendChild(card);
  overlay.classList.add('active');
  
  const close = () => {
    overlay.classList.remove('active');
    overlay.innerHTML = '';
  };
  
  card.querySelector('#vault-cancel')?.addEventListener('click', close);
  
  const form = card.querySelector('#vault-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = card.querySelector('#vault-name') as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;
    
    const submitBtn = card.querySelector('#vault-submit') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Aguarde...';
    
    try {
      if (vault) {
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
      submitBtn.disabled = false;
      submitBtn.textContent = btnText;
    }
  });
}
