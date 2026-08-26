import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from './src/constants/theme';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { LoadingScreen } from './src/features/onboarding/LoadingScreen';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { getOnboardingComplete, setOnboardingComplete } from './src/services/storage/onboardingStorage';
import { TrackingManager } from './src/services/tracking/TrackingManager';
import { prepareAdsTrackingForOnboarding } from './src/services/ads/mobileAds';
import { FirebaseSession } from './src/services/firebase/firebaseSession';

type AppGate = 'loading' | 'onboarding' | 'main';

export default function App() {
  const [gate, setGate] = useState<AppGate>('loading');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      void TrackingManager.app.open();
      await new Promise<void>(resolve => {
        setTimeout(resolve, 900);
      });
      if (cancelled) return;
      try {
        const [done] = await Promise.all([
          getOnboardingComplete(),
          FirebaseSession.ensureReady().catch(error => {
            console.warn('[FirebaseSession] bootstrap failed', error);
          })
        ]);
        if (!cancelled) {
          setGate(done ? 'main' : 'onboarding');
          if (done) {
            void prepareAdsTrackingForOnboarding();
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
            <AppNavigator />
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
