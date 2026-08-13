import { navigate } from '../router';
import { register } from '../api/auth';
import { showToast } from '../components/toast';
import { icon } from '../icons';
import { renderPasswordStrength } from '../components/passwordStrength';

export function render(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = '';
  
  const container = document.createElement('div');
  container.className = 'auth-layout';
  container.innerHTML = `
    <div class="auth-card">
      <div style="margin-bottom: var(--space-md); color: var(--color-sidebar);">
        ${icon('shield', 'xl').outerHTML}
      </div>
      <h1 class="auth-title">Crie sua Conta</h1>
      <form id="register-form" class="auth-form">
        <div class="input-group">
          <label class="input-label" for="email">E-mail</label>
          <input type="email" id="email" class="input-field" required>
        </div>
        <div class="input-group">
          <label class="input-label" for="password">Senha</label>
          <input type="password" id="password" class="input-field" required>
          <div id="password-strength-container"></div>
        </div>
        <div class="input-group" id="confirm-group">
          <label class="input-label" for="confirm-password">Confirme a Senha</label>
          <input type="password" id="confirm-password" class="input-field" required>
          <div class="input-error-msg" id="confirm-error"></div>
        </div>
        <button type="submit" class="btn btn--primary" id="btn-submit">Criar Conta</button>
      </form>
      <div class="auth-footer">
        Já tem conta? <a href="#" id="link-login">Faça login</a>
      </div>
    </div>
  `;
  
  app.appendChild(container);
  
  const form = document.getElementById('register-form') as HTMLFormElement;
  const linkLogin = document.getElementById('link-login');
  const btnSubmit = document.getElementById('btn-submit') as HTMLButtonElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const strengthContainer = document.getElementById('password-strength-container')!;
  const confirmInput = document.getElementById('confirm-password') as HTMLInputElement;
  const confirmGroup = document.getElementById('confirm-group')!;
  const confirmError = document.getElementById('confirm-error')!;
  
  strengthContainer.innerHTML = renderPasswordStrength('');

  passwordInput.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    strengthContainer.innerHTML = renderPasswordStrength(val);
  });
  
  const validateConfirm = () => {
    if (confirmInput.value && confirmInput.value !== passwordInput.value) {
      confirmGroup.classList.add('error');
      confirmError.textContent = 'As senhas não coincidem';
      return false;
    } else {
      confirmGroup.classList.remove('error');
      confirmError.textContent = '';
      return true;
    }
  };
  
  confirmInput.addEventListener('input', validateConfirm);
  passwordInput.addEventListener('input', validateConfirm);
  
  linkLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('login');
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateConfirm()) return;
    
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = passwordInput.value;
    
    if (!email || !password) return;
    
    // Validar força (min 8 chars, 1 num, 1 especial, 1 upper)
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score < 4) {
      showToast('A senha não atende aos requisitos de força', 'warning');
      return;
    }
    
    btnSubmit.classList.add('btn--loading');
    btnSubmit.disabled = true;
    
    try {
      await register(email, password);
      showToast('Conta criada com sucesso!', 'success');
      navigate('login');
    } catch (error: any) {
      showToast(error.message || 'Erro ao criar conta', 'error');
    } finally {
      btnSubmit.classList.remove('btn--loading');
      btnSubmit.disabled = false;
    }
  });
}
