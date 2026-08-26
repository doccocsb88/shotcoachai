import auth from '@react-native-firebase/auth';
import appCheck from '@react-native-firebase/app-check';

import { TrackingManager } from '../tracking/TrackingManager';

type FirebaseSessionSnapshot = {
  uid: string | null;
  idToken: string | null;
  appCheckToken: string | null;
};

function getAppCheckDebugToken(envKey: string): string | undefined {
  const raw = process.env[envKey]?.trim();
  return raw ? raw : undefined;
}

function getAndroidAppCheckProvider(debugToken?: string) {
  if (debugToken) {
    return 'debug' as const;
  }

  return 'playIntegrity' as const;
}

function getAppleAppCheckProvider(debugToken?: string) {
  if (debugToken) {
    return 'debug' as const;
  }

  if (__DEV__) {
    return 'deviceCheck' as const;
  }

  return 'appAttestWithDeviceCheckFallback' as const;
}

class FirebaseSessionManager {
  private bootstrapPromise: Promise<void> | null = null;
  private appCheckInitialized = false;
  private authListenerRegistered = false;
  private snapshot: FirebaseSessionSnapshot = {
    uid: null,
    idToken: null,
    appCheckToken: null
  };

  async ensureReady(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap();
    }

    try {
      await this.bootstrapPromise;
    } catch (error) {
      this.bootstrapPromise = null;
      throw error;
    }
  }

  async getRequestHeaders(forceRefresh = false): Promise<Record<string, string>> {
    await this.ensureReady();
    await this.refreshTokens(forceRefresh);

    if (!this.snapshot.idToken) {
      throw new Error('Missing Firebase ID token for backend request.');
    }

    if (!this.snapshot.appCheckToken) {
      throw new Error('Missing Firebase App Check token for backend request.');
    }

    return {
      Authorization: `Bearer ${this.snapshot.idToken}`,
      'X-Firebase-AppCheck': this.snapshot.appCheckToken
    };
  }

  private async bootstrap(): Promise<void> {
    await this.initializeAnonymousAuth();
    await this.initializeAppCheck();
    await this.refreshTokens(true);
  }

  private async initializeAnonymousAuth(): Promise<void> {
    if (!this.authListenerRegistered) {
      auth().onIdTokenChanged(user => {
        this.snapshot.uid = user?.uid ?? null;
        void TrackingManager.setUserId(this.snapshot.uid);
      });
      this.authListenerRegistered = true;
    }

    if (!auth().currentUser) {
      await auth().signInAnonymously();
    }

    this.snapshot.uid = auth().currentUser?.uid ?? null;
    void TrackingManager.setUserId(this.snapshot.uid);
  }

  private async initializeAppCheck(): Promise<void> {
    if (this.appCheckInitialized) {
      return;
    }

    const provider = appCheck().newReactNativeFirebaseAppCheckProvider();
    const androidDebugToken = getAppCheckDebugToken(
      'EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_ANDROID'
    );
    const appleDebugToken = getAppCheckDebugToken(
      'EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_IOS'
    );
    const androidProvider = getAndroidAppCheckProvider(androidDebugToken);
    const appleProvider = getAppleAppCheckProvider(appleDebugToken);

    console.log('[ShotCoach][AppCheck] initialize', {
      androidProvider,
      appleProvider,
      hasAndroidDebugToken: Boolean(androidDebugToken),
      hasAppleDebugToken: Boolean(appleDebugToken),
      isDev: __DEV__
    });

    provider.configure({
      android: {
        provider: androidProvider,
        debugToken: androidDebugToken
      },
      apple: {
        provider: appleProvider,
        debugToken: appleDebugToken
      }
    });

    await appCheck().initializeAppCheck({
      provider,
      isTokenAutoRefreshEnabled: true
    });

    this.appCheckInitialized = true;
  }

  private async refreshTokens(forceRefresh: boolean): Promise<void> {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('Anonymous Firebase user is not available.');
    }

    const [idToken, appCheckTokenResult] = await Promise.all([
      currentUser.getIdToken(forceRefresh),
      appCheck().getToken(forceRefresh)
    ]);

    this.snapshot = {
      uid: currentUser.uid,
      idToken,
      appCheckToken: appCheckTokenResult.token
    };
  }
}

export const FirebaseSession = new FirebaseSessionManager();
