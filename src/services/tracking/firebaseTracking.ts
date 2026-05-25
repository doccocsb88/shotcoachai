import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  logScreenView as firebaseLogScreenView,
  setUserId as firebaseSetUserId
} from '@react-native-firebase/analytics';

type TrackingParams = Record<string, unknown>;

const analytics = getAnalytics();

export async function trackEvent(name: string, params?: TrackingParams) {
  await firebaseLogEvent(analytics, name, params);
}

export async function trackScreenView(screenName: string) {
  await firebaseLogScreenView(analytics, {
    screen_name: screenName,
    screen_class: screenName
  });
}

export async function setTrackingUserId(userId: string | null) {
  await firebaseSetUserId(analytics, userId);
}
