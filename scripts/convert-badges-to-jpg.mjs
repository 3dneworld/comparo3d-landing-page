import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const badgesDir = path.join(__dirname, '../src/components/icons/badges');
const outputDir = path.join(__dirname, '../public/badges');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const badges = [
  { svg: 'TrayectoriaVerificada10Badge.svg', name: 'trayectoria-10' },
  { svg: 'TrayectoriaVerificada5Badge.svg', name: 'trayectoria-5' },
  { svg: 'CertificadoOrgBadge.svg', name: 'certificado-organico' },
];

async function convertBadges() {
  for (const badge of badges) {
    const svgPath = path.join(badgesDir, badge.svg);
    const jpgPath = path.join(outputDir, `${badge.name}.jpg`);
    const pngPath = path.join(outputDir, `${badge.name}.png`);

    try {
      // Convert to JPG (256x298 = 2x scale of 120x140 viewBox)
      await sharp(svgPath)
        .resize(256, 298, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .jpeg({ quality: 90, progressive: true })
        .toFile(jpgPath);

      // Also create PNG for transparency support
      await sharp(svgPath)
        .resize(256, 298, { fit: 'contain' })
        .png()
        .toFile(pngPath);

      console.log(`✓ ${badge.svg} → ${badge.name}.jpg (256x298) + .png`);
    } catch (err) {
      console.error(`✗ Failed to convert ${badge.svg}:`, err.message);
    }
  }

  console.log('\n✓ All badges converted successfully!');
  console.log(`Output: ${outputDir}`);
}

convertBadges();
