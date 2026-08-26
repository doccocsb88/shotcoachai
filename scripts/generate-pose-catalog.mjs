#!/usr/bin/env node
/**
 * Sync pose/collections into mobile/assets and generate TypeScript catalog.
 * Run: node scripts/generate-pose-catalog.mjs
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = path.resolve(__dirname, '..');
const POSE_COLLECTIONS_SRC = path.resolve(MOBILE_ROOT, '../pose/collections');
const ASSETS_DEST = path.join(MOBILE_ROOT, 'assets/pose-collection/collections');
const GENERATED_DIR = path.join(MOBILE_ROOT, 'src/features/pose-collection/generated');
const PHOTO_WEBP_QUALITY = 85;

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

const SCENE_TO_LOCATION = {
  beach: 'beach',
  park: 'nature',
  nature: 'nature',
  cafe: 'cafe',
  coffee: 'cafe',
  store: 'stores',
  shop: 'stores',
  bookstore: 'stores',
  street: 'street',
  urban: 'street',
  urban_outdoor: 'street',
  bridge: 'street',
  city: 'street'
};

const MOOD_TO_STYLE = {
  playful: 'playful',
  cheerful: 'playful',
  cute: 'playful',
  romantic: 'romantic',
  casual: 'casual',
  candid: 'candid',
  elegant: 'elegant',
  editorial: 'editorial',
  minimal: 'minimal',
  relaxed: 'casual',
  whimsical: 'playful',
  joyful: 'playful',
  happy: 'playful',
  friendly: 'casual',
  confident: 'editorial',
  pensive: 'candid',
  dreamy: 'candid',
  active: 'playful',
  energetic: 'playful'
};

const SHOT_TYPE_TO_FRAMING = {
  close_up: 'close_up',
  medium_shot: 'half_body',
  half_body: 'half_body',
  three_quarter: 'three_quarter',
  full_body: 'full_body'
};

const CAMERA_ANGLE_MAP = {
  eye_level: 'eye_level',
  low_angle: 'low_angle',
  slightly_low_angle: 'low_angle',
  high_angle: 'high_angle',
  side_angle: 'side_angle',
  over_shoulder: 'over_shoulder'
};

const PRIMARY_TO_BODY = {
  standing: 'standing',
  sitting: 'sitting',
  walking: 'walking',
  leaning: 'leaning',
  lying: 'lying',
  crouching: 'action',
  squatting: 'action'
};

function humanizeCollectionId(collectionId) {
  const match = collectionId.match(/^(girl|couple)_(\d+)$/i);
  if (match) {
    const kind = match[1].toLowerCase() === 'couple' ? 'Couple' : 'Solo';
    return { title: `${kind} ${match[2]}`, kind: match[1].toLowerCase() };
  }
  return {
    title: collectionId.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
    kind: 'other'
  };
}

function mapLocation(sceneCategory) {
  const normalized = (sceneCategory ?? '').toLowerCase();
  if (SCENE_TO_LOCATION[normalized]) return SCENE_TO_LOCATION[normalized];
  for (const [key, value] of Object.entries(SCENE_TO_LOCATION)) {
    if (normalized.includes(key)) return value;
  }
  return 'street';
}

function mapStyles(moods) {
  const styles = new Set();
  for (const mood of moods ?? []) {
    const mapped = MOOD_TO_STYLE[mood.toLowerCase()];
    if (mapped) styles.add(mapped);
  }
  if (styles.size === 0) styles.add('casual');
  return [...styles];
}

function mapFraming(shotType) {
  const normalized = (shotType ?? '').toLowerCase();
  return SHOT_TYPE_TO_FRAMING[normalized] ?? 'full_body';
}

function mapCameraAngle(cameraAngle) {
  const normalized = (cameraAngle ?? '').toLowerCase();
  return CAMERA_ANGLE_MAP[normalized] ?? 'eye_level';
}

function mapBodyPosition(primary) {
  const normalized = (primary ?? '').toLowerCase();
  return PRIMARY_TO_BODY[normalized] ?? 'standing';
}

function mapSubjectTypes(presentation) {
  const types = (presentation ?? []).map(value => value.toLowerCase());
  if (types.includes('feminine') && types.includes('masculine')) return ['any'];
  if (types.includes('feminine')) return ['feminine'];
  if (types.includes('masculine')) return ['masculine'];
  return ['any'];
}

function buildPoseTitle(metadata) {
  const primary = metadata.pose?.primary?.replace(/_/g, ' ') ?? 'pose';
  const secondary = metadata.pose?.secondary?.[0]?.replace(/_/g, ' ');
  if (secondary) {
    return `${capitalize(primary)} · ${capitalize(secondary)}`;
  }
  return capitalize(primary);
}

function capitalize(value) {
  return value.replace(/\b\w/g, letter => letter.toUpperCase());
}

function copyFileSync(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function resolveSourceAsset(collectionDir, folder, baseName, extensions) {
  for (const extension of extensions) {
    const candidate = path.join(collectionDir, folder, `${baseName}.${extension}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function convertPhotoToWebp(sourcePath, destinationPath) {
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  execFileSync(cwebp, ['-q', String(PHOTO_WEBP_QUALITY), '-m', '6', sourcePath, '-o', destinationPath], {
    stdio: 'pipe'
  });
}

function convertOutlineToWebp(sourcePath, destinationPath) {
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  execFileSync(cwebp, ['-lossless', '-exact', '-m', '6', sourcePath, '-o', destinationPath], {
    stdio: 'pipe'
  });
}

function syncWebpAsset(sourcePath, destinationPath, kind) {
  const sourceStat = fs.statSync(sourcePath);
  if (fs.existsSync(destinationPath)) {
    const destStat = fs.statSync(destinationPath);
    if (destStat.mtimeMs >= sourceStat.mtimeMs) return;
  }

  if (sourcePath.endsWith('.webp')) {
    copyFileSync(sourcePath, destinationPath);
    return;
  }

  if (kind === 'photo') {
    convertPhotoToWebp(sourcePath, destinationPath);
    return;
  }

  convertOutlineToWebp(sourcePath, destinationPath);
}

function removeLegacyRasterAssets(directoryPath) {
  if (!fs.existsSync(directoryPath)) return;
  for (const fileName of fs.readdirSync(directoryPath)) {
    if (/\.(jpe?g|png)$/i.test(fileName)) {
      fs.unlinkSync(path.join(directoryPath, fileName));
    }
  }
}

function collectCollections() {
  if (!fs.existsSync(POSE_COLLECTIONS_SRC)) {
    throw new Error(`Source not found: ${POSE_COLLECTIONS_SRC}`);
  }

  const collectionIds = fs
    .readdirSync(POSE_COLLECTIONS_SRC, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .filter(collectionId => fs.existsSync(path.join(POSE_COLLECTIONS_SRC, collectionId, 'collection_metadata.json')))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

  const collections = [];
  const assetRequires = [];
  const missingFiles = [];

  for (const [collectionIndex, collectionId] of collectionIds.entries()) {
    const collectionDir = path.join(POSE_COLLECTIONS_SRC, collectionId);
    const metadataPath = path.join(collectionDir, 'collection_metadata.json');
    const metadataByPoseId = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const { title, kind } = humanizeCollectionId(collectionId);
    const poses = [];

    for (const [poseIndex, [poseId, metadata]] of Object.entries(metadataByPoseId).entries()) {
      const photoBaseName = `beauty__${poseId}`;
      const outlineBaseName = `outline__${poseId}`;
      const photoSource = resolveSourceAsset(collectionDir, 'cleaned_photos', photoBaseName, [
        'webp',
        'jpg',
        'jpeg',
        'png'
      ]);
      const outlineSource = resolveSourceAsset(collectionDir, 'outlines', outlineBaseName, ['webp', 'png']);

      if (!photoSource) {
        missingFiles.push(`${collectionId}/cleaned_photos/${photoBaseName}.webp`);
        continue;
      }
      if (!outlineSource) {
        missingFiles.push(`${collectionId}/outlines/${outlineBaseName}.webp`);
        continue;
      }

      const photoName = `${photoBaseName}.webp`;
      const outlineName = `${outlineBaseName}.webp`;
      const photoDestRelative = `assets/pose-collection/collections/${collectionId}/cleaned_photos/${photoName}`;
      const outlineDestRelative = `assets/pose-collection/collections/${collectionId}/outlines/${outlineName}`;
      const photoDest = path.join(MOBILE_ROOT, photoDestRelative);
      const outlineDest = path.join(MOBILE_ROOT, outlineDestRelative);

      syncWebpAsset(photoSource, photoDest, 'photo');
      syncWebpAsset(outlineSource, outlineDest, 'outline');

      const assetKeyPhoto = photoDestRelative;
      const assetKeyOutline = outlineDestRelative;
      const requirePhotoPath = `../../../../${photoDestRelative}`;
      const requireOutlinePath = `../../../../${outlineDestRelative}`;

      assetRequires.push(`  '${assetKeyPhoto}': require('${requirePhotoPath}'),`);
      assetRequires.push(`  '${assetKeyOutline}': require('${requireOutlinePath}'),`);

      const uniquePoseId = `${collectionId}__${poseId}`;
      const sortOrder = collectionIndex * 100 + poseIndex;

      poses.push({
        id: uniquePoseId,
        collectionId,
        poseId,
        title: buildPoseTitle(metadata),
        subtitle: metadata.semanticText ?? '',
        primaryLocation: mapLocation(metadata.scene?.category),
        subjectCount: metadata.people?.count === 2 ? 2 : 1,
        ageApplicability: ['teen', 'adult'],
        subjectTypes: mapSubjectTypes(metadata.people?.presentation),
        styles: mapStyles(metadata.mood),
        framing: mapFraming(metadata.framing?.shotType),
        bodyPosition: mapBodyPosition(metadata.pose?.primary),
        cameraAngle: mapCameraAngle(metadata.framing?.cameraAngle),
        howToPose: metadata.semanticText ?? '',
        cameraGuidance: `${capitalize((metadata.framing?.shotType ?? 'full body').replace(/_/g, ' '))}, ${capitalize((metadata.framing?.cameraAngle ?? 'eye level').replace(/_/g, ' '))}.`,
        browsingImageKey: assetKeyPhoto,
        overlayImageKey: assetKeyOutline,
        searchTerms: metadata.searchTags ?? [],
        difficulty: metadata.difficulty ?? 'easy',
        sceneCategory: metadata.scene?.category ?? 'unknown',
        mood: metadata.mood ?? [],
        isFeatured: collectionIndex < 2 && poseIndex < 2,
        sortOrder,
        status: 'published',
        rawMetadata: metadata
      });
    }

    if (poses.length === 0) continue;

    removeLegacyRasterAssets(path.join(ASSETS_DEST, collectionId, 'cleaned_photos'));
    removeLegacyRasterAssets(path.join(ASSETS_DEST, collectionId, 'outlines'));

    const dominantScene = poses.reduce((counts, pose) => {
      counts[pose.sceneCategory] = (counts[pose.sceneCategory] ?? 0) + 1;
      return counts;
    }, {});
    const topScene = Object.entries(dominantScene).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'mixed';

    collections.push({
      id: collectionId,
      title,
      kind,
      subtitle: `${poses.length} poses · ${capitalize(topScene.replace(/_/g, ' '))}`,
      poseCount: poses.length,
      coverImageKey: poses[0].browsingImageKey,
      sortOrder: collectionIndex * 10,
      poses
    });
  }

  return { collections, assetRequires, missingFiles };
}

function writeGeneratedFiles({ collections, assetRequires, missingFiles }) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const assetMapContent = `// AUTO-GENERATED by scripts/generate-pose-catalog.mjs — do not edit manually.
import { ImageSourcePropType } from 'react-native';

export const poseAssetMap: Record<string, ImageSourcePropType> = {
${assetRequires.join('\n')}
};
`;

  const catalogContent = `// AUTO-GENERATED by scripts/generate-pose-catalog.mjs — do not edit manually.
import { PoseCollection } from '../poseCollectionTypes';

export const POSE_COLLECTIONS: PoseCollection[] = ${JSON.stringify(collections, null, 2)} as PoseCollection[];
`;

  fs.writeFileSync(path.join(GENERATED_DIR, 'poseAssetMap.ts'), assetMapContent);
  fs.writeFileSync(path.join(GENERATED_DIR, 'poseCollectionsData.ts'), catalogContent);

  const totalPoses = collections.reduce((sum, collection) => sum + collection.poses.length, 0);
  console.log(`Generated ${collections.length} collections, ${totalPoses} poses, ${assetRequires.length} assets.`);

  if (missingFiles.length > 0) {
    console.warn(`Warning: skipped ${missingFiles.length} poses with missing files:`);
    missingFiles.slice(0, 10).forEach(file => console.warn(`  - ${file}`));
    if (missingFiles.length > 10) {
      console.warn(`  ... and ${missingFiles.length - 10} more`);
    }
  }
}

const result = collectCollections();
writeGeneratedFiles(result);
