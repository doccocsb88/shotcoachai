import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const PRODUCTION_FREE_CAPTURE_LIMIT = 3;
export const DEBUG_FREE_CAPTURE_LIMIT = 10;
export const PRODUCTION_FREE_PHOTO_RECIPE_COUNT = 3;
export const DEBUG_FREE_PHOTO_RECIPE_COUNT = 10;

export function isDebugUsageEnvironment(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return true;
  }

  return isSimulatorOrEmulator();
}

export function getFreeCaptureLimit(): number {
  return isDebugUsageEnvironment() ? DEBUG_FREE_CAPTURE_LIMIT : PRODUCTION_FREE_CAPTURE_LIMIT;
}

export function getFreePhotoRecipeCount(): number {
  return isDebugUsageEnvironment()
    ? DEBUG_FREE_PHOTO_RECIPE_COUNT
    : PRODUCTION_FREE_PHOTO_RECIPE_COUNT;
}

function isSimulatorOrEmulator(): boolean {
  if (Platform.OS === 'android') {
    const { Fingerprint, Model } = Platform.constants;
    const fingerprint = Fingerprint?.toLowerCase() ?? '';
    const model = Model?.toLowerCase() ?? '';

    return (
      fingerprint.includes('generic') ||
      fingerprint.includes('unknown') ||
      model.includes('sdk') ||
      model.includes('emulator') ||
      model.includes('gphone')
    );
  }

  if (Platform.OS === 'ios') {
    const deviceName = Constants.deviceName?.toLowerCase() ?? '';
    return deviceName.includes('simulator');
  }

  return false;
}
