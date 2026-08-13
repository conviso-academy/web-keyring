import { icon } from '../icons';
import { state } from '../state';

export function renderHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'top-header';
  header.id = 'top-header';
  
  const breadcrumbText = state.selectedVault ? `<a href="#" id="breadcrumb-back" style="color: inherit; text-decoration: none;">Cofres</a> <span style="margin: 0 8px;">></span> <span style="color: var(--color-text);">${state.selectedVault.name}</span>` : 
                         state.currentView === 'dashboard' ? 'Cofres' : 
                         state.currentView === 'audit' ? 'Trilha de Auditoria' : 'Início';
                         
  header.innerHTML = `
    <div class="breadcrumb" id="header-breadcrumb">
      ${breadcrumbText}
    </div>
    <div class="header-actions">
      ${state.currentView === 'dashboard' ? `
        <div class="input-group" style="margin-bottom: 0;">
          <div style="position: relative; display: flex; align-items: center;">
            <div style="position: absolute; left: 10px; color: var(--color-text-secondary); pointer-events: none;">
              ${icon('search', 'sm').outerHTML}
            </div>
            <input type="text" id="header-search" class="input-field" placeholder="Buscar cofres..." style="padding-left: 32px;" value="${state.vaultSearchQuery}">
          </div>
        </div>
      ` : ''}
    </div>
  `;

  const searchInput = header.querySelector('#header-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.vaultSearchQuery = (e.target as HTMLInputElement).value;
      document.dispatchEvent(new CustomEvent('vaultSearchChange'));
    });
  }

  const breadcrumbBack = header.querySelector('#breadcrumb-back');
  if (breadcrumbBack) {
    breadcrumbBack.addEventListener('click', (e) => {
      e.preventDefault();
      state.selectedVault = null;
      // Re-render dashboard
      import('../views/dashboard').then(({ render }) => render());
    });
  }

  return header;
}
