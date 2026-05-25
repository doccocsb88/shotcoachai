import * as FileSystem from 'expo-file-system';

const IMAGE_DIR = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}shotcoach-images/`;

export async function persistImageFile(imageUri: string, filePrefix: string): Promise<string> {
  if (!imageUri || imageUri.startsWith('mock_')) {
    return imageUri;
  }

  await ensureImageDir();
  const sourceUri = normalizeFileUri(imageUri);
  const info = await FileSystem.getInfoAsync(sourceUri);
  if (!info.exists) {
    return imageUri;
  }

  if (sourceUri.startsWith(IMAGE_DIR)) {
    return sourceUri;
  }

  const dest = `${IMAGE_DIR}${filePrefix}-${Date.now()}${inferExtension(imageUri)}`;
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
