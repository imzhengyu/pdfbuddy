const path = require('path');

const testInputsDir = path.join(__dirname, '..', 'test-inputs');

async function generateTestImages() {
  const { Jimp, JimpMime } = require('jimp');

  console.log('Generating test images with more context...\n');

  // Helper - clamp value between 0 and 255
  const clamp = (v) => Math.max(0, Math.min(255, v));

  // Generate JPEG with brown gradient
  console.log('Creating test-image.jpg (brown fox scene)...');
  const jpegImage = new Jimp({ width: 800, height: 600, color: 0x8B4513ff });

  const jpegPath = path.join(testInputsDir, 'test-image.jpg');
  await jpegImage.write(jpegPath, { mime: JimpMime.jpeg });
  console.log('  Created:', jpegPath);

  // Generate PNG with green
  console.log('\nCreating test-image.png (green nature scene)...');
  const pngImage = new Jimp({ width: 800, height: 600, color: 0x228B22ff });

  const pngPath = path.join(testInputsDir, 'test-image.png');
  await pngImage.write(pngPath, { mime: JimpMime.png });
  console.log('  Created:', pngPath);

  // Generate second PNG with orange
  console.log('\nCreating test-image2.png (orange gradient)...');
  const pngImage2 = new Jimp({ width: 800, height: 600, color: 0xFF4500ff });

  const pngPath2 = path.join(testInputsDir, 'test-image2.png');
  await pngImage2.write(pngPath2, { mime: JimpMime.png });
  console.log('  Created:', pngPath2);

  console.log('\n✓ Done! Generated test images:');
  console.log('  - test-image.jpg (brown, 800x600)');
  console.log('  - test-image.png (green, 800x600)');
  console.log('  - test-image2.png (orange-red, 800x600)');
}

generateTestImages().catch(console.error);