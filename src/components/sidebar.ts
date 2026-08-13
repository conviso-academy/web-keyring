import { icon } from '../icons';
import { navigate } from '../router';
import { state } from '../state';

export function renderSidebar(): HTMLElement {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';
  
  sidebar.innerHTML = `
    <div class="sidebar-header">
      ${icon('shield', 'lg').outerHTML}
      <span>WebKeyring</span>
    </div>
    <nav class="sidebar-nav">
      <a class="sidebar-item ${state.currentView === 'dashboard' ? 'sidebar-item--active' : ''}" data-view="dashboard">
        ${icon('layoutDashboard').outerHTML}
        Início
      </a>
      <a class="sidebar-item ${state.currentView === 'dashboard' ? 'sidebar-item--active' : ''}" data-view="dashboard">
        ${icon('lock').outerHTML}
        Cofres
      </a>
      <a class="sidebar-item ${state.currentView === 'audit' ? 'sidebar-item--active' : ''}" data-view="audit">
        ${icon('scrollText').outerHTML}
        Auditoria
      </a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-item" style="cursor: default;">
        ${icon('user').outerHTML}
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${state.currentUser?.email || 'Usuário'}">
          ${state.currentUser?.email || 'Usuário'}
        </span>
      </div>
      <a class="sidebar-item" id="btn-logout">
        ${icon('logOut').outerHTML}
        Sair
      </a>
    </div>
  `;

  sidebar.querySelectorAll('.sidebar-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = (e.currentTarget as HTMLElement).getAttribute('data-view');
      if (view) {
        navigate(view as 'dashboard' | 'audit');
      }
    });
  });

  const btnLogout = sidebar.querySelector('#btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      // Import dynamic to avoid circular dependencies in router
      const { logout } = await import('../api/auth');
      await logout();
      state.isAuthenticated = false;
      state.currentUser = null;
      navigate('login');
    });
  }

  return sidebar;
}
