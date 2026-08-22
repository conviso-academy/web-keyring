const fs = require('fs');
let content = fs.readFileSync('src/views/twoFaSetup.ts', 'utf8');
content = content.replace("import { icon } from '../icons';", "import { icon } from '../icons';\nimport QRCode from 'qrcode';");
// Remove renderQrCodeSvg
content = content.replace(/function renderQrCodeSvg\(\): string \{[\s\S]*?\}\n\n/, '');
// Replace ${renderQrCodeSvg()} with canvas
content = content.replace("${renderQrCodeSvg()}", '<canvas id="qrcode-canvas" width="160" height="160"></canvas>');

// Find the place where renderSetupContent is called, and add QRCode.toCanvas inside it or after it.
// Actually, I can just modify renderSetupContent:
content = content.replace("function renderSetupContent(", "async function renderSetupContent(");
content = content.replace("container.innerHTML = `", "container.innerHTML = `");
content = content.replace(/const btnCopyCodes = document.getElementById\('btn-copy-codes'\);/, `
  const canvas = document.getElementById('qrcode-canvas');
  if (canvas) {
    try {
      await QRCode.toCanvas(canvas, provisioningUri, { width: 160, margin: 1, color: { dark: '#1B2A4A', light: '#FFFFFF' } });
    } catch (e) {
      console.error('Failed to render QR Code', e);
    }
  }

  const btnCopyCodes = document.getElementById('btn-copy-codes');`);

fs.writeFileSync('src/views/twoFaSetup.ts', content);
