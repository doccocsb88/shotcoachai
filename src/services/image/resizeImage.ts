import * as ImageManipulator from 'expo-image-manipulator';

const MAX_LONG_EDGE = 1536;

export async function resizeImageIfNeeded(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_LONG_EDGE } }],
    {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG
    }
  );

  return result.uri;
}
