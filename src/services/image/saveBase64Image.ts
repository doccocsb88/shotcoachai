import * as FileSystem from 'expo-file-system';

export async function saveBase64ImageToCache(base64: string, filePrefix = 'ai-guide'): Promise<string> {
  const fileUri = `${FileSystem.cacheDirectory}${filePrefix}-${Date.now()}.png`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64
  });

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
