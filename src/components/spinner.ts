export function renderSkeleton(): string {
  return `
    <div style="padding: var(--space-lg);">
      <div class="skeleton" style="height: 24px; margin-bottom: var(--space-md); width: 30%;"></div>
      <div class="skeleton" style="height: 48px; margin-bottom: var(--space-xs);"></div>
      <div class="skeleton" style="height: 48px; margin-bottom: var(--space-xs);"></div>
      <div class="skeleton" style="height: 48px;"></div>
    </div>
  `;
}

export function renderSpinner(message: string = 'Carregando...'): string {
  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-2xl);">
      <div class="btn--loading" style="width: 24px; height: 24px; color: var(--color-accent); margin-bottom: var(--space-sm);"></div>
      <span style="color: var(--color-text-secondary);">${message}</span>
    </div>
  `;
}
