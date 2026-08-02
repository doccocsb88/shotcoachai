import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync
} from 'expo-tracking-transparency';
import mobileAds from 'react-native-google-mobile-ads';

import { trackEvent } from '../tracking/firebaseTracking';
import { AdsManager } from './AdsManager';

let mobileAdsInitPromise: Promise<void> | null = null;
let trackingRequestPromise: Promise<PermissionStatus> | null = null;

export async function requestIdfaTrackingPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'ios') {
    return PermissionStatus.GRANTED;
  }

  if (!trackingRequestPromise) {
    trackingRequestPromise = (async () => {
      const current = await getTrackingPermissionsAsync();
      if (current.status !== PermissionStatus.UNDETERMINED) {
        void trackEvent('idfa_permission_status', { status: current.status });
        return current.status;
      }

      const requested = await requestTrackingPermissionsAsync();
      void trackEvent('idfa_permission_requested', { status: requested.status });
      return requested.status;
    })();
  }

  return trackingRequestPromise;
}

export async function initializeGoogleMobileAds(): Promise<void> {
  if (!mobileAdsInitPromise) {
    mobileAdsInitPromise = mobileAds()
      .initialize()
      .then(() => {
        AdsManager.initialize();
      })
      .catch(error => {
        mobileAdsInitPromise = null;
        if (__DEV__) {
          console.warn('Google Mobile Ads failed to initialize', error);
        }
      });
  }

  return mobileAdsInitPromise;
}

export async function prepareAdsTrackingForOnboarding(): Promise<void> {
  await requestIdfaTrackingPermission();
  await initializeGoogleMobileAds();
}
