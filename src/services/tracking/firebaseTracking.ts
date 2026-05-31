import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  logScreenView as firebaseLogScreenView,
  setUserId as firebaseSetUserId
} from '@react-native-firebase/analytics';

type TrackingParams = Record<string, unknown>;

let analytics: ReturnType<typeof getAnalytics> | null = null;
try {
  analytics = getAnalytics();
} catch (e) {
  console.warn('[Firebase] Analytics not available:', e);
}

export async function trackEvent(name: string, params?: TrackingParams) {
  if (!analytics) return;
  try {
    await firebaseLogEvent(analytics, name, params);
  } catch (e) {
    console.warn('[Firebase] trackEvent failed:', e);
  }
}

export async function trackScreenView(screenName: string) {
  if (!analytics) return;
  try {
    await firebaseLogScreenView(analytics, {
      screen_name: screenName,
      screen_class: screenName
    });
  } catch (e) {
    console.warn('[Firebase] trackScreenView failed:', e);
  }
}

export async function setTrackingUserId(userId: string | null) {
  if (!analytics) return;
  try {
    await firebaseSetUserId(analytics, userId);
  } catch (e) {
    console.warn('[Firebase] setTrackingUserId failed:', e);
  }
}
