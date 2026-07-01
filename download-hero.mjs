import fs from 'fs';
import https from 'https';
import sharp from 'sharp';
import path from 'path';

const url = 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=2400&q=90';
const targetDir = path.join(process.cwd(), 'public', 'pic');
const targetFile = path.join(targetDir, 'hero-bg.webp');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download image. Status Code: ${res.statusCode}`);
    return;
  }

  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(targetFile)
      .then(info => {
        console.log('Image processed and saved to', targetFile);
        console.log(info);
      })
      .catch(err => {
        console.error('Error processing image:', err);
      });
  });
}).on('error', (err) => {
  console.error('Error downloading image:', err);
});
