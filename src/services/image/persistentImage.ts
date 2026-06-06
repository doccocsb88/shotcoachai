import * as FileSystem from 'expo-file-system';

const IMAGE_DIR = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}shotcoach-images/`;

export function resolveLocalImageUri(imageUri: string | undefined): string | undefined {
  if (!imageUri) return undefined;
  if (imageUri.startsWith('http') || imageUri.startsWith('mock_')) return imageUri;

  // Fix changing iOS simulator/device UUIDs by extracting the filename
  // and appending it to the current app's document/cache directory.
  const match = imageUri.match(/shotcoach-images\/([^/]+)$/);
  if (match) {
    return `${IMAGE_DIR}${match[1]}`;
  }

  return imageUri;
}

export async function persistImageFile(imageUri: string, filePrefix: string): Promise<string> {
  const resolvedUri = resolveLocalImageUri(imageUri);
  if (!resolvedUri || resolvedUri.startsWith('mock_') || resolvedUri.startsWith('http')) {
    return resolvedUri || imageUri;
  }

  await ensureImageDir();
  const sourceUri = normalizeFileUri(resolvedUri);
  const info = await FileSystem.getInfoAsync(sourceUri);
  if (!info.exists) {
    return resolvedUri;
  }

  if (sourceUri.startsWith(IMAGE_DIR)) {
    return sourceUri;
  }

  const dest = `${IMAGE_DIR}${filePrefix}-${Date.now()}${inferExtension(resolvedUri)}`;
  await FileSystem.copyAsync({
    from: sourceUri,
    to: dest
  });
  return dest;
}

export async function writeBase64ImageToPersistentStorage(
  base64: string,
  filePrefix = 'ai-guide'
): Promise<string> {
  await ensureImageDir();
  const fileUri = `${IMAGE_DIR}${filePrefix}-${Date.now()}.png`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64
  });

  return fileUri;
}

export function normalizeFileUri(imageUri: string): string {
  if (imageUri.startsWith('file://')) {
    return imageUri;
  }
  if (imageUri.startsWith('/')) {
    return `file://${imageUri}`;
  }
  return imageUri;
}

async function ensureImageDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
}

function inferExtension(imageUri: string): string {
  const withoutQuery = imageUri.split('?')[0].toLowerCase();
  if (withoutQuery.endsWith('.png')) return '.png';
  if (withoutQuery.endsWith('.webp')) return '.webp';
  if (withoutQuery.endsWith('.heic')) return '.heic';
  if (withoutQuery.endsWith('.jpeg')) return '.jpeg';
  return '.jpg';
}
