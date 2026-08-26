import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'react-native';

const MAX_LONG_EDGE = 1536;
const MAX_FILE_SIZE_BYTES = 2_400_000;
const JPEG_COMPRESSION = 0.82;
const COACH_MAX_LONG_EDGE = 1792;
const COACH_MAX_FILE_SIZE_BYTES = 2_800_000;
const COACH_JPEG_COMPRESSION = 0.9;

export interface PreparedImage {
  uri: string;
  mimeType: string;
}

export interface ResizeImageOptions {
  maxLongEdge?: number;
  maxFileSizeBytes?: number;
  jpegCompression?: number;
}

export const COACH_IMAGE_PRESET: ResizeImageOptions = {
  maxLongEdge: COACH_MAX_LONG_EDGE,
  maxFileSizeBytes: COACH_MAX_FILE_SIZE_BYTES,
  jpegCompression: COACH_JPEG_COMPRESSION
};

export async function resizeImageIfNeeded(
  uri: string,
  mimeType = 'image/jpeg',
  options: ResizeImageOptions = {}
): Promise<PreparedImage> {
  const maxLongEdge = options.maxLongEdge ?? MAX_LONG_EDGE;
  const maxFileSizeBytes = options.maxFileSizeBytes ?? MAX_FILE_SIZE_BYTES;
  const jpegCompression = options.jpegCompression ?? JPEG_COMPRESSION;
  const size = await getImageSize(uri);
  const longEdge = Math.max(size.width, size.height);
  const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
  const fileSize = fileInfo.exists ? fileInfo.size ?? 0 : 0;
  const shouldNormalizeToJpeg = mimeType !== 'image/jpeg' || fileSize > maxFileSizeBytes;

  if (longEdge <= maxLongEdge && !shouldNormalizeToJpeg) {
    return { uri, mimeType };
  }

  const resize =
    size.width >= size.height
      ? { width: maxLongEdge }
      : { height: maxLongEdge };

  const result = await ImageManipulator.manipulateAsync(
    uri,
    longEdge > maxLongEdge ? [{ resize }] : [],
    {
      compress: jpegCompression,
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
