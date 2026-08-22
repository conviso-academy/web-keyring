import { getSecretVersions, revealSecret } from '../api/vaults';
import { showToast } from './toast';
import { icon } from '../icons';
import type { Secret } from '../types';

export async function showSecretVersionsModal(vault_id: string, secret: Secret) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal" style="max-width: 600px;">
      <div class="modal-header">
        <h2 class="modal-title">Versões: ${secret.name}</h2>
        <button class="modal-close" id="btn-close-versions-modal">&times;</button>
      </div>
      <div class="modal-body" id="versions-modal-body">
        <div style="display: flex; justify-content: center; padding: var(--space-xl);">
          <div class="btn--loading" style="width: 24px; height: 24px; color: var(--color-accent);"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector('#btn-close-versions-modal')?.addEventListener('click', close);

  const body = modal.querySelector('#versions-modal-body') as HTMLElement;

  try {
    const versions = await getSecretVersions(vault_id, secret.id);
    if (versions.length === 0) {
      body.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center;">Nenhuma versão encontrada.</p>';
      return;
    }

    let html = `
      <table class="table" style="margin-top: 0;">
        <thead>
          <tr>
            <th>Versão</th>
            <th>Data</th>
            <th>Criado por</th>
            <th style="text-align: right;">Ação</th>
          </tr>
        </thead>
        <tbody>
    `;

    versions.forEach(v => {
      const date = new Date(v.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      html += `
        <tr>
          <td>v${v.version_number}</td>
          <td>${date}</td>
          <td style="color: var(--color-text-secondary);">${v.created_by}</td>
          <td style="text-align: right;">
            <button class="btn btn--ghost btn--sm action-reveal-version" data-version="${v.version_number}">
              ${icon('eye', 'sm').outerHTML} Revelar
            </button>
          </td>
        </tr>
        <tr class="version-reveal-row" id="version-reveal-${v.version_number}" style="display: none;">
          <td colspan="4" style="padding: 0 var(--space-md) var(--space-md) var(--space-md); border-bottom: 1px solid var(--color-border-light); background-color: var(--color-bg);">
            <div style="display: flex; align-items: center; justify-content: space-between; background-color: var(--color-sidebar); color: white; padding: var(--space-md); border-radius: var(--radius-md); margin-top: var(--space-sm);">
              <code class="font-mono version-value" style="font-size: 1rem; word-break: break-all;"></code>
              <button class="btn btn--secondary btn--sm action-copy-version">
                ${icon('copy', 'sm').outerHTML} Copiar
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    body.innerHTML = html;

    body.querySelectorAll('.action-reveal-version').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const btnEl = e.currentTarget as HTMLButtonElement;
        const version = parseInt(btnEl.getAttribute('data-version') || '0', 10);
        const revealRow = body.querySelector(`#version-reveal-${version}`) as HTMLElement;
        
        if (revealRow.style.display === 'table-row') {
          revealRow.style.display = 'none';
          return;
        }

        btnEl.disabled = true;
        btnEl.innerHTML = `<div class="btn--loading" style="width: 14px; height: 14px; margin-right: 4px;"></div> Revelando`;
        
        try {
          const { value } = await revealSecret(vault_id, secret.id, version);
          revealRow.style.display = 'table-row';
          const codeEl = revealRow.querySelector('.version-value') as HTMLElement;
          codeEl.textContent = value;
          
          const copyBtn = revealRow.querySelector('.action-copy-version');
          copyBtn?.addEventListener('click', () => {
            navigator.clipboard.writeText(value);
            showToast('Copiado!', 'success');
          });
        } catch (err: any) {
          showToast('Erro ao revelar versão', 'error');
        } finally {
          btnEl.disabled = false;
          btnEl.innerHTML = `${icon('eye', 'sm').outerHTML} Revelar`;
        }
      });
    });

  } catch (err: any) {
    body.innerHTML = '<p style="color: var(--color-danger); text-align: center;">Erro ao carregar versões.</p>';
  }
}
