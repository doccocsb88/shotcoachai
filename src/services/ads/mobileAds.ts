import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync
} from 'expo-tracking-transparency';
import mobileAds from 'react-native-google-mobile-ads';

import { TrackingManager } from '../tracking/TrackingManager';
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
        void TrackingManager.ads.idfaStatus(current.status);
        return current.status;
      }

      const requested = await requestTrackingPermissionsAsync();
      void TrackingManager.ads.idfaRequested(requested.status);
      return requested.status;
    })();
  }

  return trackingRequestPromise;
}

export async function initializeGoogleMobileAds(): Promise<void> {
  if (Platform.OS === 'ios') {
    await requestIdfaTrackingPermission();
  }

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
  await initializeGoogleMobileAds();
}
