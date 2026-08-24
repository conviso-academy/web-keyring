import './styles/main.css';
import { navigate, registerView } from './router';
import { state } from './state';
import { getMe } from './api/auth';

import * as loginView from './views/login';
import * as registerViewImpl from './views/register';
import * as dashboardView from './views/dashboard';
import * as auditLogView from './views/auditLog';
import * as twoFaSetupView from './views/twoFaSetup';
import * as twoFaVerifyView from './views/twoFaVerify';

async function init() {
  registerView('login', loginView.render);
  registerView('register', registerViewImpl.render);
  registerView('dashboard', dashboardView.render);
  registerView('audit', auditLogView.render);
  registerView('2fa_setup', twoFaSetupView.render);
  registerView('2fa_verify', twoFaVerifyView.render);

  try {
    const user = await getMe();
    if (user) {
      state.isAuthenticated = true;
      state.currentUser = user;
      navigate('dashboard');
    }
  } catch (err) {
    // Normal se não houver sessão ativa
    state.isAuthenticated = false;
    // O client de API (`apiRequest`) já lida com redirecionamento para o login em caso de 401.
    // Mas garantimos caso o erro não seja 401.
    navigate('login');
  }
}

init();
