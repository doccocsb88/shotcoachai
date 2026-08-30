import {
  getCrashlytics,
  setUserId as firebaseSetCrashlyticsUserId
} from '@react-native-firebase/crashlytics';

let crashlytics: ReturnType<typeof getCrashlytics> | null = null;

try {
  crashlytics = getCrashlytics();
} catch (error) {
  console.warn('[Firebase] Crashlytics not available:', error);
}

export async function setCrashlyticsUserId(userId: string | null) {
  if (!crashlytics) return;
  try {
    await firebaseSetCrashlyticsUserId(crashlytics, userId ?? '');
  } catch (error) {
    console.warn('[Firebase] setCrashlyticsUserId failed:', error);
  }
}
