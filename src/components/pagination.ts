import { icon } from '../icons';

export function renderPagination(
  currentPage: number,
  totalPages: number
): string {
  if (totalPages <= 1) return '';

  return `
    <div style="display: flex; align-items: center; justify-content: center; gap: var(--space-md); margin-top: var(--space-lg);">
      <button class="btn btn--secondary btn--icon pagination-prev" ${currentPage <= 1 ? 'disabled' : ''}>
        ${icon('chevronLeft', 'sm').outerHTML}
      </button>
      <span style="font-size: 0.875rem; color: var(--color-text-secondary);">
        Página <strong>${currentPage}</strong> de <strong>${totalPages}</strong>
      </span>
      <button class="btn btn--secondary btn--icon pagination-next" ${currentPage >= totalPages ? 'disabled' : ''}>
        ${icon('chevronRight', 'sm').outerHTML}
      </button>
    </div>
  `;
}
