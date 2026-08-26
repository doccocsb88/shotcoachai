import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from './src/constants/theme';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { type LaunchPaywallSource } from './src/core/navigation/navigationTypes';
import { LoadingScreen } from './src/features/onboarding/LoadingScreen';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { getOnboardingComplete, setOnboardingComplete } from './src/services/storage/onboardingStorage';
import { TrackingManager } from './src/services/tracking/TrackingManager';
import { prepareAdsTrackingForOnboarding } from './src/services/ads/mobileAds';
import { FirebaseSession } from './src/services/firebase/firebaseSession';
import { UserManager } from './src/services/user/UserManager';

type AppGate = 'loading' | 'onboarding' | 'main';

export default function App() {
  const [gate, setGate] = useState<AppGate>('loading');
  const [launchPaywallSource, setLaunchPaywallSource] = useState<LaunchPaywallSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      void TrackingManager.app.open();
      await new Promise<void>(resolve => {
        setTimeout(resolve, 900);
      });
      if (cancelled) return;
      try {
        const [onboardingComplete] = await Promise.all([
          getOnboardingComplete(),
          FirebaseSession.ensureReady().catch(error => {
            console.warn('[FirebaseSession] bootstrap failed', error);
          }),
          UserManager.ensureReady().catch(error => {
            console.warn('[UserManager] bootstrap failed', error);
          })
        ]);
        if (!cancelled) {
          if (onboardingComplete) {
            setLaunchPaywallSource(UserManager.getState().isPremium ? null : 'app_open');
            void prepareAdsTrackingForOnboarding();
            setGate('main');
          } else {
            setGate('onboarding');
          }
        }
      } catch {
        if (!cancelled) {
          setGate('onboarding');
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOnboardingDone = useCallback(async () => {
    void TrackingManager.onboarding.completed();
    await setOnboardingComplete();
    await prepareAdsTrackingForOnboarding();
    setLaunchPaywallSource('onboarding');
    setGate('main');
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.shell}>
        <StatusBar style="dark" />
        {gate === 'loading' ? (
          <LoadingScreen />
        ) : gate === 'onboarding' ? (
          <OnboardingScreen onDone={handleOnboardingDone} />
        ) : (
          <View style={styles.root}>
            <AppNavigator launchPaywallSource={launchPaywallSource} />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  /** Single flex root so children with flex:1 get a bounded parent on iOS. */
  shell: {
    flex: 1
  },
  root: {
    backgroundColor: colors.background,
    flex: 1
  }
});
