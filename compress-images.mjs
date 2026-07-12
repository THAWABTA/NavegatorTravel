/**
 * Image Compression Script — Pre-deployment optimization
 * Converts all JPEG/JPG/PNG images in public/pic/ to WebP (1920px max width, 80% quality)
 * Skips files already in WebP format or under 1 MB.
 * Outputs a mapping of old → new filenames for code reference updates.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PIC_DIR = path.join(process.cwd(), 'public', 'pic');
const TARGET_WIDTH = 1920;
const QUALITY = 80;
const SIZE_THRESHOLD = 1 * 1024 * 1024; // 1 MB

async function compressImages() {
  const files = fs.readdirSync(PIC_DIR);
  const mapping = []; // { oldName, newName, oldSize, newSize }
  let totalOldBytes = 0;
  let totalNewBytes = 0;

  for (const file of files) {
    const filePath = path.join(PIC_DIR, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) continue;

    const ext = path.extname(file).toLowerCase();

    // Skip already-webp and the PNG logo
    if (ext === '.webp') {
      console.log(`SKIP (already webp): ${file}`);
      totalOldBytes += stat.size;
      totalNewBytes += stat.size;
      continue;
    }

    // Skip files under threshold
    if (stat.size < SIZE_THRESHOLD) {
      console.log(`SKIP (under 1 MB): ${file} (${(stat.size / 1024).toFixed(0)} KB)`);
      totalOldBytes += stat.size;
      totalNewBytes += stat.size;
      continue;
    }

    // Only process jpeg/jpg/png
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      console.log(`SKIP (unsupported ext): ${file}`);
      totalOldBytes += stat.size;
      totalNewBytes += stat.size;
      continue;
    }

    // Determine new filename: strip all old extensions, add .webp
    // e.g. "bangkok.jpg.jpeg" → "bangkok.webp"
    //      "cairo.jpg"         → "cairo.webp"
    //      "IMG_4817 copy (12) (1).png" → "IMG_4817 copy (12) (1).webp"
    let baseName = file;
    // Strip trailing extensions (.jpg, .jpeg, .png) — handle double extensions like .jpg.jpeg
    while (/\.(jpg|jpeg|png)$/i.test(baseName)) {
      baseName = baseName.replace(/\.(jpg|jpeg|png)$/i, '');
    }
    const newName = baseName + '.webp';
    const newPath = path.join(PIC_DIR, newName);

    try {
      await sharp(filePath)
        .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(newPath);

      const newStat = fs.statSync(newPath);
      const oldKB = (stat.size / 1024).toFixed(0);
      const newKB = (newStat.size / 1024).toFixed(0);
      const reduction = ((1 - newStat.size / stat.size) * 100).toFixed(0);

      console.log(`COMPRESSED: ${file} (${oldKB} KB) → ${newName} (${newKB} KB) [${reduction}% smaller]`);

      // Delete the original
      fs.unlinkSync(filePath);

      mapping.push({
        oldPath: `/pic/${file}`,
        newPath: `/pic/${newName}`,
        oldSizeKB: parseInt(oldKB),
        newSizeKB: parseInt(newKB)
      });

      totalOldBytes += stat.size;
      totalNewBytes += newStat.size;
    } catch (err) {
      console.error(`ERROR processing ${file}:`, err.message);
      totalOldBytes += stat.size;
      totalNewBytes += stat.size;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total before: ${(totalOldBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Total after:  ${(totalNewBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Saved:        ${((totalOldBytes - totalNewBytes) / 1024 / 1024).toFixed(1)} MB`);
  console.log(`\nMapping (old → new):`);
  mapping.forEach(m => console.log(`  "${m.oldPath}" → "${m.newPath}"`));

  // Write mapping to a temp file for the code update step
  fs.writeFileSync(
    path.join(process.cwd(), 'image-mapping.json'),
    JSON.stringify(mapping, null, 2)
  );
  console.log('\nMapping written to image-mapping.json');
}

compressImages().catch(console.error);
