import { getSecretVersions } from '../api/vaults';
import { openModal, escapeHtml } from './modal';
import type { Secret } from '../types';

export async function showSecretVersionsModal(vault_id: string, secret: Secret) {
  const { body } = openModal({
    title: 'Histórico de Versões',
    subtitle: `Segredo "${secret.name}"`,
    iconName: 'scrollText',
    size: 'lg',
    bodyHTML: `
      <div style="display: flex; justify-content: center; padding: var(--space-xl);">
        <div class="btn--loading" style="width: 24px; height: 24px; color: var(--color-accent);"></div>
      </div>
    `,
  });

  try {
    const data = await getSecretVersions(vault_id, secret.id);
    const versions = data.items;
    if (versions.length === 0) {
      body.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center;">Nenhuma versão encontrada.</p>';
      return;
    }

    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Versão</th>
            <th>Data</th>
            <th>Criado por</th>
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
          <td style="color: var(--color-text-secondary);">${escapeHtml(v.created_by)}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    if (data.total_pages > 1) {
      html += `<p style="color: var(--color-text-secondary); text-align: center; font-size: 0.875rem;">Página ${data.page} de ${data.total_pages} (${data.total} versões)</p>`;
    }
    body.innerHTML = html;

  } catch (err: any) {
    body.innerHTML = '<p style="color: var(--color-error); text-align: center;">Erro ao carregar versões.</p>';
  }
}
