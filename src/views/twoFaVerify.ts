import { state } from '../state';
import { navigate } from '../router';
import { verify2FA } from '../api/auth';
import { showToast } from '../components/toast';
import { icon } from '../icons';

export function render(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = '';

  if (!state.tempSessionToken) {
    navigate('login');
    return;
  }

  let isBackupMode = false;

  const container = document.createElement('div');
  container.className = 'auth-layout';
  container.innerHTML = `
    <div class="auth-card">
      <div style="margin-bottom: var(--space-md); color: var(--color-sidebar);">
        ${icon('shield', 'xl').outerHTML}
      </div>
      <h1 class="auth-title" style="margin-bottom: var(--space-xs);">Verificação de 2 Fatores</h1>
      <p id="verify-description" style="color: var(--color-text-secondary); font-size: 0.875rem; margin-bottom: var(--space-xl);">
        Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.
      </p>

      <form id="twofa-verify-form" class="auth-form">
        <div class="input-group" id="verify-input-group">
          <label class="input-label" for="verify-code" id="verify-label">Código do Autenticador</label>
          <input 
            type="text" 
            id="verify-code" 
            class="input-field font-mono twofa-input-code" 
            inputmode="numeric" 
            pattern="[0-9]*" 
            autocomplete="one-time-code" 
            maxlength="6" 
            placeholder="000 000"
            autofocus
            required
          >
        </div>

        <button type="submit" class="btn btn--primary" id="btn-submit-verify">
          Entrar
        </button>
      </form>

      <div class="twofa-actions-links">
        <a href="#" id="link-toggle-mode">Usar um código de backup</a>
        <a href="#" id="link-back-login" style="color: var(--color-text-muted);">Voltar para o Login</a>
      </div>
    </div>
  `;

  app.appendChild(container);

  const form = document.getElementById('twofa-verify-form') as HTMLFormElement;
  const inputCode = document.getElementById('verify-code') as HTMLInputElement;
  const inputLabel = document.getElementById('verify-label') as HTMLLabelElement;
  const descText = document.getElementById('verify-description') as HTMLParagraphElement;
  const linkToggle = document.getElementById('link-toggle-mode') as HTMLAnchorElement;
  const linkBack = document.getElementById('link-back-login') as HTMLAnchorElement;
  const btnSubmit = document.getElementById('btn-submit-verify') as HTMLButtonElement;

  // Auto focus
  inputCode.focus();

  // Helper para alternar entre TOTP e Backup Code
  const updateModeUi = () => {
    inputCode.value = '';
    if (isBackupMode) {
      descText.textContent = 'Digite um dos seus códigos de backup de 8 caracteres salvos durante a configuração.';
      inputLabel.textContent = 'Código de Backup (8 caracteres)';
      inputCode.setAttribute('inputmode', 'text');
      inputCode.removeAttribute('pattern');
      inputCode.removeAttribute('autocomplete');
      inputCode.setAttribute('maxlength', '8');
      inputCode.placeholder = 'Ex: a1b2c3d4';
      linkToggle.textContent = 'Usar código do aplicativo autenticador';
    } else {
      descText.textContent = 'Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.';
      inputLabel.textContent = 'Código do Autenticador';
      inputCode.setAttribute('inputmode', 'numeric');
      inputCode.setAttribute('pattern', '[0-9]*');
      inputCode.setAttribute('autocomplete', 'one-time-code');
      inputCode.setAttribute('maxlength', '6');
      inputCode.placeholder = '000 000';
      linkToggle.textContent = 'Usar um código de backup';
    }
    inputCode.focus();
  };

  inputCode.addEventListener('input', () => {
    if (!isBackupMode) {
      inputCode.value = inputCode.value.replace(/\D/g, '').slice(0, 6);
    } else {
      inputCode.value = inputCode.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    }
  });

  linkToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isBackupMode = !isBackupMode;
    updateModeUi();
  });

  linkBack.addEventListener('click', (e) => {
    e.preventDefault();
    state.tempSessionToken = null;
    state.twoFaSetupData = null;
    navigate('login');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = inputCode.value.trim();

    if (!isBackupMode && code.length !== 6) {
      showToast('Digite o código de 6 dígitos do autenticador.', 'warning');
      inputCode.focus();
      return;
    }

    if (isBackupMode && code.length !== 8) {
      showToast('O código de backup deve possuir 8 caracteres.', 'warning');
      inputCode.focus();
      return;
    }

    btnSubmit.classList.add('btn--loading');
    btnSubmit.disabled = true;

    try {
      const response = await verify2FA(state.tempSessionToken!, code);
      state.isAuthenticated = true;
      state.currentUser = response.user;
      state.tempSessionToken = null;
      state.twoFaSetupData = null;
      showToast('Login realizado com sucesso!', 'success');
      navigate('dashboard');
    } catch (err: any) {
      showToast(err.message || 'Código de verificação inválido', 'error');
      inputCode.value = '';
      inputCode.focus();
    } finally {
      btnSubmit.classList.remove('btn--loading');
      btnSubmit.disabled = false;
    }
  });
}
