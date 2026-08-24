import { state } from '../state';
import { navigate } from '../router';
import { setup2FA, verifySetup2FA } from '../api/auth';
import { showToast } from '../components/toast';
import { icon } from '../icons';
import QRCode from 'qrcode';

export async function render(): Promise<void> {
  const app = document.getElementById('app')!;
  app.innerHTML = '';

  if (!state.tempSessionToken) {
    navigate('login');
    return;
  }

  const container = document.createElement('div');
  container.className = 'auth-layout';

  // Layout inicial com skeleton / loading
  container.innerHTML = `
    <div class="auth-card auth-card--wide">
      <div style="margin-bottom: var(--space-md); color: var(--color-sidebar);">
        ${icon('shield', 'xl').outerHTML}
      </div>
      <h1 class="auth-title" style="margin-bottom: var(--space-xs);">Configuração de Segurança em 2 Passos</h1>
      <p style="color: var(--color-text-secondary); font-size: 0.875rem; margin-bottom: var(--space-xl);">
        Aumente a segurança da sua conta configurando a autenticação em dois fatores (2FA).
      </p>

      <div id="setup-loading-state" style="padding: var(--space-xl) 0; text-align: center;">
        <div class="skeleton" style="height: 160px; width: 160px; margin: 0 auto var(--space-md); border-radius: var(--radius-md);"></div>
        <div class="skeleton" style="height: 20px; width: 70%; margin: 0 auto var(--space-sm);"></div>
        <div class="skeleton" style="height: 80px; width: 100%; margin: var(--space-md) auto;"></div>
      </div>

      <div id="setup-content-state" style="display: none;"></div>
    </div>
  `;

  app.appendChild(container);

  try {
    const data = await setup2FA(state.tempSessionToken);
    state.twoFaSetupData = {
      provisioning_uri: data.provisioning_uri,
      backup_codes: data.backup_codes
    };

    const loadingState = document.getElementById('setup-loading-state');
    const contentState = document.getElementById('setup-content-state');
    if (loadingState) loadingState.style.display = 'none';
    if (contentState) {
      contentState.style.display = 'block';
      await renderSetupContent(contentState, data.backup_codes, data.provisioning_uri);
    }
  } catch (err: any) {
    showToast(err.message || 'Erro ao carregar dados de configuração do 2FA', 'error');
    navigate('login');
  }
}

async function renderSetupContent(
  container: HTMLElement,
  backupCodes: string[],
  provisioningUri: string
): Promise<void> {
  // Extrair chave manual do URI
  const secretMatch = provisioningUri.match(/secret=([^&]+)/);
  const secretKey = secretMatch ? secretMatch[1] : 'ERRO_DE_CHAVE';

  container.innerHTML = `
    <!-- Passo 1: QR Code -->
    <div class="twofa-step">
      <div class="twofa-step-title">
        <span class="badge badge--neutral" style="font-size: 0.8125rem; font-weight: 700;">1</span>
        <span>Escaneie o QR Code</span>
      </div>
      <p class="twofa-step-desc">
        Abra seu aplicativo autenticador (Google Authenticator, Authy, Bitwarden, etc.) e aponte a câmera para o código abaixo:
      </p>
      
      <div class="twofa-qr-box">
        <div class="twofa-qr-code" style="display: flex; justify-content: center;">
          <canvas id="qrcode-canvas" width="160" height="160"></canvas>
        </div>
        <div class="twofa-secret-container">
          <span style="font-size: 0.75rem; color: var(--color-text-secondary);">Chave de configuração manual:</span>
          <code class="font-mono twofa-secret-code">${secretKey}</code>
        </div>
      </div>
    </div>

    <!-- Passo 2: Códigos de Backup -->
    <div class="twofa-step">
      <div class="twofa-step-title">
        <span class="badge badge--neutral" style="font-size: 0.8125rem; font-weight: 700;">2</span>
        <span>Salve seus Códigos de Backup</span>
      </div>
      
      <div class="twofa-backup-warning">
        <div class="twofa-backup-warning-header">
          ${icon('alertTriangle', 'sm').outerHTML}
          <span>Importante</span>
        </div>
        <div class="twofa-backup-warning-text">
          Estes códigos não serão exibidos novamente. Guarde-os em local seguro para acessar sua conta caso perca seu autenticador.
        </div>
      </div>

      <div class="twofa-backup-grid">
        ${backupCodes.map(code => `<div class="twofa-backup-item font-mono">${code}</div>`).join('')}
      </div>

      <button type="button" class="btn btn--secondary btn--sm" id="btn-copy-codes" style="width: 100%; margin-top: var(--space-xs);">
        ${icon('copy', 'sm').outerHTML}
        <span>Copiar Códigos</span>
      </button>
    </div>

    <!-- Passo 3: Verificação -->
    <div class="twofa-step" style="margin-bottom: 0;">
      <div class="twofa-step-title">
        <span class="badge badge--neutral" style="font-size: 0.8125rem; font-weight: 700;">3</span>
        <span>Confirmação</span>
      </div>
      <p class="twofa-step-desc">
        Digite o código de 6 dígitos gerado pelo seu app para confirmar a ativação:
      </p>

      <form id="twofa-setup-form" class="auth-form">
        <div class="input-group">
          <label class="input-label" for="setup-totp-code">Código do Autenticador (6 dígitos)</label>
          <input 
            type="text" 
            id="setup-totp-code" 
            class="input-field font-mono twofa-input-code" 
            inputmode="numeric" 
            pattern="[0-9]*" 
            autocomplete="one-time-code" 
            maxlength="6" 
            placeholder="000 000"
            required
          >
        </div>

        <button type="submit" class="btn btn--primary" id="btn-confirm-setup">
          Confirmar e Entrar
        </button>
      </form>
    </div>

    <div class="auth-footer" style="margin-top: var(--space-lg);">
      <a href="#" id="link-cancel-setup">Voltar para o Login</a>
    </div>
  `;

  // Handlers
  const canvas = document.getElementById('qrcode-canvas');
  if (canvas) {
    try {
      await QRCode.toCanvas(canvas, provisioningUri, { 
        width: 160, 
        margin: 1, 
        color: { dark: '#1B2A4A', light: '#FFFFFF' } 
      });
    } catch (e) {
      console.error('Failed to render QR Code', e);
    }
  }

  const btnCopyCodes = document.getElementById('btn-copy-codes');
  btnCopyCodes?.addEventListener('click', async () => {
    const textToCopy = `OVNI - Códigos de Backup 2FA:\n\n${backupCodes.join('\n')}\n\nGuarde em local seguro.`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('Códigos de backup copiados para a área de transferência!', 'success');
    } catch {
      showToast('Erro ao copiar códigos automaticamente', 'warning');
    }
  });

  const linkCancel = document.getElementById('link-cancel-setup');
  linkCancel?.addEventListener('click', (e) => {
    e.preventDefault();
    state.tempSessionToken = null;
    state.twoFaSetupData = null;
    navigate('login');
  });

  const form = document.getElementById('twofa-setup-form') as HTMLFormElement;
  const inputCode = document.getElementById('setup-totp-code') as HTMLInputElement;
  const btnConfirm = document.getElementById('btn-confirm-setup') as HTMLButtonElement;

  // Formatação amigável para dígitos
  inputCode.addEventListener('input', () => {
    inputCode.value = inputCode.value.replace(/\D/g, '').slice(0, 6);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = inputCode.value.trim();

    if (!code || code.length !== 6) {
      showToast('Digite o código completo de 6 dígitos.', 'warning');
      inputCode.focus();
      return;
    }

    btnConfirm.classList.add('btn--loading');
    btnConfirm.disabled = true;

    try {
      const response = await verifySetup2FA(state.tempSessionToken!, code);
      state.isAuthenticated = true;
      state.currentUser = response.user;
      state.tempSessionToken = null;
      state.twoFaSetupData = null;
      showToast('Autenticação em dois fatores ativada com sucesso!', 'success');
      navigate('dashboard');
    } catch (err: any) {
      showToast(err.message || 'Código inválido. Tente novamente.', 'error');
      inputCode.value = '';
      inputCode.focus();
    } finally {
      btnConfirm.classList.remove('btn--loading');
      btnConfirm.disabled = false;
    }
  });
}
