import './styles/main.css';
import { navigate, registerView } from './router';

import * as loginView from './views/login';
import * as registerViewImpl from './views/register';
import * as dashboardView from './views/dashboard';
import * as auditLogView from './views/auditLog';
import * as twoFaSetupView from './views/twoFaSetup';
import * as twoFaVerifyView from './views/twoFaVerify';

function init() {
  registerView('login', loginView.render);
  registerView('register', registerViewImpl.render);
  registerView('dashboard', dashboardView.render);
  registerView('audit', auditLogView.render);
  registerView('2fa_setup', twoFaSetupView.render);
  registerView('2fa_verify', twoFaVerifyView.render);

  navigate('login');
}

init();
