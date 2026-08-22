import { icon } from '../icons';

export interface ModalOptions {
  title: string;
  subtitle?: string;
  iconName?: 'shield' | 'keyRound' | 'lock' | 'database' | 'pencil' | 'scrollText' | 'trash' | 'alertTriangle' | 'info';
  iconVariant?: 'accent' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  bodyHTML: string;
}

export interface ModalHandle {
  root: HTMLElement;
  body: HTMLElement;
  close: () => void;
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function openModal(options: ModalOptions): ModalHandle {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const iconHTML = options.iconName
    ? `<span class="modal-icon${options.iconVariant && options.iconVariant !== 'accent' ? ` modal-icon--${options.iconVariant}` : ''}">${icon(options.iconName).outerHTML}</span>`
    : '';

  backdrop.innerHTML = `
    <div class="modal${options.size && options.size !== 'md' ? ` modal--${options.size}` : ''}" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="modal-title-group">
          ${iconHTML}
          <div>
            <h2 class="modal-title">${escapeHtml(options.title)}</h2>
            ${options.subtitle ? `<p class="modal-subtitle">${escapeHtml(options.subtitle)}</p>` : ''}
          </div>
        </div>
        <button type="button" class="modal-close" data-modal-close aria-label="Fechar">
          ${icon('x', 'sm').outerHTML}
        </button>
      </div>
      <div class="modal-body"></div>
    </div>
  `;

  const body = backdrop.querySelector('.modal-body') as HTMLElement;
  body.innerHTML = options.bodyHTML;

  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  const close = () => {
    document.removeEventListener('keydown', onKeyDown);
    document.body.style.overflow = '';
    backdrop.remove();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKeyDown);

  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) close();
  });

  backdrop.querySelector('[data-modal-close]')?.addEventListener('click', close);

  const firstField = body.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input:not([type=hidden]), select, textarea');
  if (firstField) {
    requestAnimationFrame(() => firstField.focus());
  }

  return { root: backdrop, body, close };
}
