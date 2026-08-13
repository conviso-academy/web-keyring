export function renderPasswordStrength(password: string): string {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  let color = 'var(--color-border)';
  let label = 'Muito Fraca';
  let width = '25%';
  
  if (score === 2) {
    color = 'var(--color-warning)';
    label = 'Fraca';
    width = '50%';
  } else if (score === 3) {
    color = 'var(--color-info)';
    label = 'Média';
    width = '75%';
  } else if (score === 4) {
    color = 'var(--color-success)';
    label = 'Forte';
    width = '100%';
  } else if (score === 1 && password.length > 0) {
    color = 'var(--color-error)';
    label = 'Muito Fraca';
    width = '25%';
  } else if (score === 0) {
    width = '0%';
    label = '';
  }

  return `
    <div style="margin-top: 4px;">
      <div style="height: 4px; background: var(--color-border-light); border-radius: 2px; overflow: hidden;">
        <div style="height: 100%; width: ${width}; background-color: ${color}; transition: all var(--transition-base);"></div>
      </div>
      <div style="font-size: 0.75rem; color: ${color}; margin-top: 4px; text-align: right; min-height: 14px;">
        ${label}
      </div>
    </div>
  `;
}
