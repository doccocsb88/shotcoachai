import * as FileSystem from 'expo-file-system/legacy';

import { writeBase64ImageToPersistentStorage } from './persistentImage';

export async function saveBase64ImageToCache(base64: string, filePrefix = 'ai-guide'): Promise<string> {
  const fileUri = await writeBase64ImageToPersistentStorage(base64, filePrefix);

  if (process.env.EXPO_PUBLIC_DEBUG_OPENAI_FLOW === '1' || (typeof __DEV__ !== 'undefined' && __DEV__)) {
    const info = await FileSystem.getInfoAsync(fileUri);
    console.log('[ShotCoach][OpenAI][image-edit] saved generated image', {
      fileUri,
      exists: info.exists,
      size: info.exists ? info.size : undefined,
      base64Length: base64.length,
      base64Prefix: base64.slice(0, 24)
    });
  }

  return fileUri;
}
