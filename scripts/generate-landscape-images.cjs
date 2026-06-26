const path = require('path');
const fs = require('fs');
const https = require('https');

const testInputsDir = path.join(__dirname, '..', 'test-inputs');

const API_KEY = process.env.MINIMAX_API_KEY;
const API_URL = 'https://api.minimaxi.com/v1/image_generation';

const prompts = [
  'A serene mountain landscape at sunset with golden light, dramatic clouds, and a peaceful lake reflecting the mountains, photorealistic',
  'A lush green forest with sunlight streaming through the canopy, wildflowers in the foreground, nature photography style',
  'A beautiful coastal scene with turquoise water, white sandy beach, and dramatic cliffs, warm afternoon light, photorealistic',
  'A rolling hills countryside with vibrant green meadows, a winding river, and a small farmhouse in the distance, sunny day',
];

async function generateImage(prompt, outputPath, apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'image-01',
      prompt: prompt,
      aspect_ratio: '16:9',
      response_format: 'base64',
    });

    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
      try {
        const response = JSON.parse(body);
        if (response.data && response.data.image_base64) {
          // image_base64 is an array
          const imageArray = response.data.image_base64;
          const imageData = Array.isArray(imageArray) ? imageArray[0] : imageArray;
          const buffer = Buffer.from(imageData, 'base64');
          fs.writeFileSync(outputPath, buffer);
          resolve();
        } else if (response.error) {
          reject(new Error(response.error.message || 'API error'));
        } else {
          reject(new Error('Unexpected response format: ' + body.substring(0, 200)));
        }
      } catch (e) {
        reject(e);
      }
    });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  if (!API_KEY) {
    console.error('Error: MINIMAX_API_KEY environment variable not set');
    console.log('\nTo set your API key, run:');
    console.log('  Windows (cmd): set MINIMAX_API_KEY=your_api_key');
    console.log('  Windows (PowerShell): $env:MINIMAX_API_KEY="your_api_key"');
    console.log('  Linux/Mac: export MINIMAX_API_KEY=your_api_key');
    process.exit(1);
  }

  console.log('Generating landscape images using MiniMax API...\n');

  const images = [
    { prompt: prompts[0], file: 'test-image.jpg', desc: 'Sunset mountain landscape' },
    { prompt: prompts[1], file: 'test-image2.jpg', desc: 'Forest with sunlight' },
    { prompt: prompts[2], file: 'test-image3.jpg', desc: 'Coastal scene' },
  ];

  for (const img of images) {
    const outputPath = path.join(testInputsDir, img.file);
    console.log(`Generating ${img.desc}...`);
    try {
      await generateImage(img.prompt, outputPath, API_KEY);
      const stats = fs.statSync(outputPath);
      console.log(`  ✓ Saved: ${img.file} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main();