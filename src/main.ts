import './styles/main.css';
import { navigate, registerView } from './router';

import * as loginView from './views/login';
import * as registerViewImpl from './views/register';
import * as dashboardView from './views/dashboard';
import * as auditLogView from './views/auditLog';

function init() {
  registerView('login', loginView.render);
  registerView('register', registerViewImpl.render);
  registerView('dashboard', dashboardView.render);
  registerView('audit', auditLogView.render);

  navigate('login');
}

init();
