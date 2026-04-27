import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

const MAX_LONG_EDGE = 1536;

export interface PreparedImage {
  uri: string;
  mimeType: string;
}

export async function resizeImageIfNeeded(uri: string, mimeType = 'image/jpeg'): Promise<PreparedImage> {
  const size = await getImageSize(uri);
  const longEdge = Math.max(size.width, size.height);

  if (longEdge <= MAX_LONG_EDGE) {
    return { uri, mimeType };
  }

  const resize =
    size.width >= size.height
      ? { width: MAX_LONG_EDGE }
      : { height: MAX_LONG_EDGE };

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize }],
    {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG
    }
  );

  return {
    uri: result.uri,
    mimeType: 'image/jpeg'
  };
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject
    );
  });
}
