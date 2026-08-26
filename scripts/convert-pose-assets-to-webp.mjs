#!/usr/bin/env node
/**
 * Convert pose collection JPG/PNG assets to WebP.
 *
 * - cleaned_photos/beauty__*.jpg  -> beauty__*.webp  (quality 85)
 * - outlines/outline__*.png       -> outline__*.webp (lossless, preserves alpha)
 *
 * Usage:
 *   node scripts/convert-pose-assets-to-webp.mjs
 *   node scripts/convert-pose-assets-to-webp.mjs --remove-originals
 *   node scripts/convert-pose-assets-to-webp.mjs --collections-dir ../pose/collections
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = path.resolve(__dirname, '..');

const PHOTO_QUALITY = 85;
const args = process.argv.slice(2);
const removeOriginals = args.includes('--remove-originals');
const collectionsDirArg = args.find((_, index, list) => list[index - 1] === '--collections-dir');
const COLLECTIONS_DIR = path.resolve(
  collectionsDirArg ?? path.join(MOBILE_ROOT, '../pose/collections')
);

function findCwebp() {
  const candidates = ['cwebp', '/opt/homebrew/bin/cwebp', '/usr/local/bin/cwebp'];
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['-version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      // try next
    }
  }
  throw new Error('cwebp not found. Install: brew install webp');
}

const cwebp = findCwebp();

function convertPhoto(sourcePath, destinationPath) {
  execFileSync(cwebp, ['-q', String(PHOTO_QUALITY), '-m', '6', sourcePath, '-o', destinationPath], {
    stdio: 'pipe'
  });
}

function convertOutline(sourcePath, destinationPath) {
  execFileSync(cwebp, ['-lossless', '-exact', '-m', '6', sourcePath, '-o', destinationPath], {
    stdio: 'pipe'
  });
}

function convertDirectory(directoryPath, pattern, suffix, convertFn) {
  if (!fs.existsSync(directoryPath)) return { converted: 0, skipped: 0, savedBytes: 0 };

  let converted = 0;
  let skipped = 0;
  let savedBytes = 0;

  for (const fileName of fs.readdirSync(directoryPath)) {
    const match = fileName.match(pattern);
    if (!match) continue;

    const poseId = match[1];
    const sourcePath = path.join(directoryPath, fileName);
    const destinationPath = path.join(directoryPath, `${suffix}__${poseId}.webp`);

    if (fs.existsSync(destinationPath)) {
      const sourceStat = fs.statSync(sourcePath);
      const destStat = fs.statSync(destinationPath);
      if (destStat.mtimeMs >= sourceStat.mtimeMs) {
        skipped += 1;
        continue;
      }
    }

    convertFn(sourcePath, destinationPath);
    const sourceSize = fs.statSync(sourcePath).size;
    const destSize = fs.statSync(destinationPath).size;
    savedBytes += Math.max(0, sourceSize - destSize);
    converted += 1;

    if (removeOriginals) {
      fs.unlinkSync(sourcePath);
    }
  }

  return { converted, skipped, savedBytes };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

if (!fs.existsSync(COLLECTIONS_DIR)) {
  console.error(`Collections dir not found: ${COLLECTIONS_DIR}`);
  process.exit(1);
}

const collectionIds = fs
  .readdirSync(COLLECTIONS_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
  .map(entry => entry.name)
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

let totalConverted = 0;
let totalSkipped = 0;
let totalSavedBytes = 0;

for (const collectionId of collectionIds) {
  const collectionDir = path.join(COLLECTIONS_DIR, collectionId);
  const photoStats = convertDirectory(
    path.join(collectionDir, 'cleaned_photos'),
    /^beauty__(.+)\.(jpg|jpeg|png)$/i,
    'beauty',
    convertPhoto
  );
  const outlineStats = convertDirectory(
    path.join(collectionDir, 'outlines'),
    /^outline__(.+)\.png$/i,
    'outline',
    convertOutline
  );

  const collectionConverted = photoStats.converted + outlineStats.converted;
  const collectionSkipped = photoStats.skipped + outlineStats.skipped;
  const collectionSaved = photoStats.savedBytes + outlineStats.savedBytes;

  if (collectionConverted > 0) {
    console.log(
      `${collectionId}: converted ${collectionConverted}, skipped ${collectionSkipped}, saved ${formatBytes(collectionSaved)}`
    );
  }

  totalConverted += collectionConverted;
  totalSkipped += collectionSkipped;
  totalSavedBytes += collectionSaved;
}

console.log(
  `Done. ${totalConverted} files converted, ${totalSkipped} up-to-date, ${formatBytes(totalSavedBytes)} saved.` +
    (removeOriginals ? ' Originals removed.' : '')
);

if (totalConverted === 0 && totalSkipped === 0) {
  console.warn('No JPG/PNG pose assets found to convert.');
}
