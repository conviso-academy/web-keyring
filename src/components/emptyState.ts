import { icon, icons } from '../icons';

export function renderEmptyState(
  iconName: keyof typeof icons,
  message: string,
  ctaText?: string,
  _onCta?: () => void
): string {
  const btnHtml = ctaText ? `<button class="btn btn--primary" id="empty-state-btn" style="margin-top: var(--space-md);">${ctaText}</button>` : '';
  
  // Return HTML string, caller handles the button event binding
  return `
    <div class="empty-state">
      ${icon(iconName, 'xl').outerHTML}
      <h3 style="margin-bottom: var(--space-xs);">${message}</h3>
      ${btnHtml}
    </div>
  `;
}
