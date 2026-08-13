export function showConfirmDialog(message: string, onConfirm: () => void, onCancel?: () => void): void {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  
  overlay.innerHTML = '';
  
  const card = document.createElement('div');
  card.className = 'card';
  card.style.maxWidth = '400px';
  card.style.width = '100%';
  
  card.innerHTML = `
    <div style="margin-bottom: var(--space-xl); font-size: 1rem;">
      ${message}
    </div>
    <div style="display: flex; justify-content: flex-end; gap: var(--space-sm);">
      <button class="btn btn--ghost" id="confirm-cancel">Cancelar</button>
      <button class="btn btn--danger" id="confirm-ok">Excluir</button>
    </div>
  `;
  
  overlay.appendChild(card);
  overlay.classList.add('active');
  
  const close = () => {
    overlay.classList.remove('active');
    overlay.innerHTML = '';
  };
  
  card.querySelector('#confirm-cancel')?.addEventListener('click', () => {
    close();
    if (onCancel) onCancel();
  });
  
  card.querySelector('#confirm-ok')?.addEventListener('click', () => {
    close();
    onConfirm();
  });
}
