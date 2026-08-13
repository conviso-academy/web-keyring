import { icon } from '../icons';

export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  
  let iconName: 'checkCircle' | 'xCircle' | 'alertTriangle' | 'info' = 'info';
  if (type === 'success') iconName = 'checkCircle';
  if (type === 'error') iconName = 'xCircle';
  if (type === 'warning') iconName = 'alertTriangle';
  
  toast.innerHTML = `
    <div style="color: var(--color-${type})">
      ${icon(iconName, 'lg').outerHTML}
    </div>
    <div style="flex: 1;">
      ${message}
    </div>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });
  
  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => {
      toast.remove();
    }, 250); // match transition duration
  }, 4000);
}
