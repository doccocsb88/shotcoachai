import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  logScreenView as firebaseLogScreenView,
  setUserId as firebaseSetUserId
} from '@react-native-firebase/analytics';

type ScalarParam = string | number;
type AnalyticsItem = {
  item_id?: string;
  item_name?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};
type AnalyticsParams = Record<string, ScalarParam | AnalyticsItem[] | undefined>;

let analytics: ReturnType<typeof getAnalytics> | null = null;
try {
  analytics = getAnalytics();
} catch (e) {
  console.warn('[Firebase] Analytics not available:', e);
}

function sanitizeScalarParams(params?: Record<string, unknown>): Record<string, ScalarParam> | undefined {
  if (!params) return undefined;

  const sanitized: Record<string, ScalarParam> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) continue;
    if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[key.slice(0, 40)] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      sanitized[key.slice(0, 40)] = value ? 1 : 0;
      continue;
    }
    sanitized[key.slice(0, 40)] = String(value).slice(0, 100);
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export async function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!analytics) return;
  try {
    await firebaseLogEvent(analytics, name, sanitizeScalarParams(params));
  } catch (e) {
    console.warn('[Firebase] trackEvent failed:', e);
  }
}

export async function trackCommerceEvent(name: string, params?: Record<string, unknown>) {
  if (!analytics) return;
  try {
    const payload: AnalyticsParams = {};
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === undefined || value === null) continue;
      if (key === 'items' && Array.isArray(value)) {
        payload.items = value as AnalyticsItem[];
        continue;
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        payload[key] = value;
        continue;
      }
      if (typeof value === 'boolean') {
        payload[key] = value ? 1 : 0;
        continue;
      }
      payload[key] = String(value).slice(0, 100);
    }
    await firebaseLogEvent(analytics, name, payload);
  } catch (e) {
    console.warn('[Firebase] trackCommerceEvent failed:', e);
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
