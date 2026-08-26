import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export async function shareImage(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri);
}

export async function saveImageToLibrary(uri: string): Promise<void> {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission was denied.');
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}
