import { openModal, escapeHtml } from './modal';

export function showConfirmDialog(message: string, onConfirm: () => void, onCancel?: () => void): void {
  const { body, close } = openModal({
    title: 'Confirmar Exclusão',
    subtitle: 'Esta ação não poderá ser desfeita.',
    iconName: 'alertTriangle',
    iconVariant: 'danger',
    size: 'sm',
    bodyHTML: `
      <p class="confirm-message">${escapeHtml(message)}</p>
    `,
  });

  const modalEl = body.closest('.modal') as HTMLElement;
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button type="button" class="btn btn--ghost" id="confirm-cancel">Cancelar</button>
    <button type="button" class="btn btn--danger" id="confirm-ok">Excluir</button>
  `;
  modalEl.appendChild(footer);

  body.querySelector('#confirm-cancel')?.addEventListener('click', () => {
    close();
    if (onCancel) onCancel();
  });

  body.closest('.modal')!.querySelector('#confirm-ok')?.addEventListener('click', () => {
    close();
    onConfirm();
  });
}
