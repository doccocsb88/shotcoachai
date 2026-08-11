import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import { UserManager } from '../user/UserManager';

const ANDROID_INTERSTITIAL_ID = 'ca-app-pub-9552312736312538/9488938788';
const IOS_INTERSTITIAL_ID = 'ca-app-pub-9552312736312538/4583878265';
const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === 'ios'
    ? IOS_INTERSTITIAL_ID
    : ANDROID_INTERSTITIAL_ID;
const COOLDOWN_MS = 45 * 1000; // 45 seconds

class AdsManagerImpl {
  private interstitial: InterstitialAd | null = null;
  private lastAdShowTime: number = 0;
  private loaded: boolean = false;

  public initialize() {
    this.loadInterstitial();
  }

  private loadInterstitial() {
    this.interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      this.loaded = true;
    });

    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      this.loaded = false;
      this.lastAdShowTime = Date.now();
      // Reload for the next time
      this.loadInterstitial();
    });

    this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      if (__DEV__) {
        console.warn('Ad error:', error);
      }
      this.loaded = false;
      // Retry loading after some time
      setTimeout(() => this.loadInterstitial(), 10000);
    });

    this.interstitial.load();
  }

  public async showInterstitialIfAppropriate(): Promise<void> {
    const isPremium = UserManager.getState().isPremium;
    if (isPremium) {
      return;
    }

    const now = Date.now();
    if (now - this.lastAdShowTime < COOLDOWN_MS) {
      return;
    }

    if (!this.loaded || !this.interstitial) {
      return;
    }

    return new Promise((resolve) => {
      // Ensure we resolve if the ad fails to show or is closed
      const unsubscribeClosed = this.interstitial!.addAdEventListener(AdEventType.CLOSED, () => {
        unsubscribeClosed();
        unsubscribeError();
        resolve();
      });
      
      const unsubscribeError = this.interstitial!.addAdEventListener(AdEventType.ERROR, () => {
        unsubscribeClosed();
        unsubscribeError();
        resolve();
      });

      try {
        this.interstitial!.show();
      } catch (error) {
        if (__DEV__) {
          console.warn('Failed to show interstitial:', error);
        }
        unsubscribeClosed();
        unsubscribeError();
        resolve();
      }
    });
  }
}

export const AdsManager = new AdsManagerImpl();
