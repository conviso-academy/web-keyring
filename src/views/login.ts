import { state } from '../state';
import { navigate } from '../router';
import { login } from '../api/auth';
import { showToast } from '../components/toast';
import { icon } from '../icons';

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
      <h1 class="auth-title">OVNI - Only a Vault Nothing Impressive</h1>
      <form id="login-form" class="auth-form">
        <div class="input-group">
          <label class="input-label" for="email">E-mail</label>
          <input type="email" id="email" class="input-field" required>
        </div>
        <div class="input-group">
          <label class="input-label" for="password">Senha</label>
          <input type="password" id="password" class="input-field" required>
        </div>
        <button type="submit" class="btn btn--primary" id="btn-submit">Entrar</button>
      </form>
      <div class="auth-footer">
        Ainda não tem conta? <a href="#" id="link-register">Cadastre-se</a>
      </div>
    </div>
  `;
  
  app.appendChild(container);
  
  const form = document.getElementById('login-form') as HTMLFormElement;
  const linkRegister = document.getElementById('link-register');
  const btnSubmit = document.getElementById('btn-submit') as HTMLButtonElement;
  
  linkRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('register');
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    
    if (!email || !password) return;
    
    btnSubmit.classList.add('btn--loading');
    btnSubmit.disabled = true;
    
    try {
      const { user } = await login(email, password);
      state.isAuthenticated = true;
      state.currentUser = user;
      navigate('dashboard');
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login', 'error');
    } finally {
      btnSubmit.classList.remove('btn--loading');
      btnSubmit.disabled = false;
    }
  });
}
