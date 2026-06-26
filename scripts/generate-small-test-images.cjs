const path = require('path');

const testInputsDir = path.join(__dirname, '..', 'test-inputs');

async function generateTestImages() {
  const { Jimp, JimpMime } = require('jimp');

  console.log('Generating smaller test images...\n');

  // Generate small JPEG (under 50KB)
  console.log('Creating test-image.jpg (small, ~20KB)...');
  const jpegImage = new Jimp({ width: 640, height: 360, color: 0x8B4513ff });
  const jpegPath = path.join(testInputsDir, 'test-image.jpg');
  await jpegImage.write(jpegPath, { mime: JimpMime.jpeg });
  const jpegStats = require('fs').statSync(jpegPath);
  console.log(`  Created: test-image.jpg (${(jpegStats.size / 1024).toFixed(1)} KB)`);

  // Generate small PNG (under 100KB)
  console.log('\nCreating test-image.png (small, ~50KB)...');
  const pngImage = new Jimp({ width: 640, height: 360, color: 0x228B22ff });
  const pngPath = path.join(testInputsDir, 'test-image.png');
  await pngImage.write(pngPath, { mime: JimpMime.png });
  const pngStats = require('fs').statSync(pngPath);
  console.log(`  Created: test-image.png (${(pngStats.size / 1024).toFixed(1)} KB)`);

  // Generate second small PNG
  console.log('\nCreating test-image2.png (small, ~50KB)...');
  const pngImage2 = new Jimp({ width: 640, height: 360, color: 0xFF4500ff });
  const pngPath2 = path.join(testInputsDir, 'test-image2.png');
  await pngImage2.write(pngPath2, { mime: JimpMime.png });
  const pngStats2 = require('fs').statSync(pngPath2);
  console.log(`  Created: test-image2.png (${(pngStats2.size / 1024).toFixed(1)} KB)`);

  console.log('\nDone!');
}

generateTestImages().catch(console.error);