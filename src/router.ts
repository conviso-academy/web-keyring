import { state, AppState } from './state';

type ViewName = AppState['currentView'];

const viewRenderers: Record<ViewName, () => void> = {} as any;

export function registerView(name: ViewName, renderer: () => void): void {
  viewRenderers[name] = renderer;
}

export function navigate(view: ViewName): void {
  if (view !== 'login' && view !== 'register' && !state.isAuthenticated) {
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
