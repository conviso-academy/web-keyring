import { state, AppState } from './state';

type ViewName = AppState['currentView'];

const viewRenderers: Record<ViewName, () => void> = {} as any;

export function registerView(name: ViewName, renderer: () => void): void {
  viewRenderers[name] = renderer;
}

export function navigate(view: ViewName): void {
  // Se tentar acessar rota protegida sem autenticação, limpa token temporário e redireciona para login
  if (view !== 'login' && view !== 'register' && view !== '2fa_setup' && view !== '2fa_verify' && !state.isAuthenticated) {
    state.tempSessionToken = null;
    state.twoFaSetupData = null;
    navigate('login');
    return;
  }

  // Se tentar acessar rotas de 2FA sem possuir sessão temporária e sem estar autenticado, volta para login
  if ((view === '2fa_setup' || view === '2fa_verify') && !state.tempSessionToken && !state.isAuthenticated) {
    navigate('login');
    return;
  }

  state.currentView = view;
  renderCurrentView();
}

export function renderCurrentView(): void {
  const renderer = viewRenderers[state.currentView];
  if (renderer) renderer();
}
