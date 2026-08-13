import { renderSidebar } from './sidebar';
import { renderHeader } from './header';

export function ensureAppLayout(): void {
  let appLayout = document.querySelector('.app-layout');
  
  if (!appLayout) {
    const app = document.getElementById('app')!;
    app.innerHTML = ''; // Limpa a tela inteira (ex: caso venha do login)
    
    appLayout = document.createElement('div');
    appLayout.className = 'app-layout';
    
    const sidebar = renderSidebar();
    
    const mainArea = document.createElement('div');
    mainArea.className = 'main-area';
    
    const header = renderHeader();
    
    const contentArea = document.createElement('div');
    contentArea.className = 'content-area';
    contentArea.id = 'content'; // ID para as views montarem o conteúdo
    
    mainArea.appendChild(header);
    mainArea.appendChild(contentArea);
    
    appLayout.appendChild(sidebar);
    appLayout.appendChild(mainArea);
    
    app.appendChild(appLayout);
  }
}
