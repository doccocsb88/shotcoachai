import { useCallback } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { NavigationContainer, type NavigationState } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';

import { PaywallScreen } from '../../features/paywall/PaywallScreen';
import { colors } from '../../constants/theme';
import { SettingView } from '../../features/settings/SettingView';
import { AppWebView } from '../../components/common/AppWebView';
import { TrackingManager } from '../../services/tracking/TrackingManager';
import { AppNavigationProvider, useAppNavigation } from './AppNavigationProvider';
import { navigationRef } from './navigationRef';
import { RootStackNavigator } from './RootStackNavigator';
import { routeNameToTrackingScreen, type RootStackParamList } from './navigationTypes';

enableScreens();

function getActiveRouteName(state: NavigationState | undefined): keyof RootStackParamList {
  if (!state) {
    return 'Home';
  }
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name as keyof RootStackParamList;
}

function NavigationOverlays() {
  const navigation = useAppNavigation();

  return (
    <>
      <SettingView
        visible={navigation.menuOpen}
        onClose={navigation.closeMenu}
        onOpenPaywall={navigation.openPaywallFromSettings}
        onOpenLegal={navigation.openLegalFromSettings}
      >
        <AppWebView
          title={navigation.legalDocument?.title ?? ''}
          documentKey={navigation.legalDocument?.documentKey}
          visible={navigation.menuOpen && navigation.legalDocument !== null}
          onClose={navigation.closeLegalDocument}
        />
        <Modal
          animationType="slide"
          visible={navigation.menuOpen && navigation.paywallOpen}
          onRequestClose={navigation.closePaywall}
          statusBarTranslucent
          transparent
        >
          <PaywallScreen onBack={navigation.closePaywall} paywallType={navigation.paywallType} />
        </Modal>
      </SettingView>
      <AppWebView
        title={navigation.legalDocument?.title ?? ''}
        documentKey={navigation.legalDocument?.documentKey}
        visible={!navigation.menuOpen && navigation.legalDocument !== null}
        onClose={navigation.closeLegalDocument}
      />
      <Modal
        animationType="slide"
        visible={navigation.paywallOpen && !navigation.menuOpen}
        onRequestClose={navigation.closePaywall}
        statusBarTranslucent
        transparent
      >
        <PaywallScreen onBack={navigation.closePaywall} paywallType={navigation.paywallType} />
      </Modal>
    </>
  );
}

function AppNavigationShell() {
  return (
    <AppNavigationProvider>
      <View style={styles.navigationShell}>
        <RootStackNavigator />
      </View>
      <NavigationOverlays />
    </AppNavigationProvider>
  );
}

export function AppNavigator() {
  const handleStateChange = useCallback((state: NavigationState | undefined) => {
    const routeName = getActiveRouteName(state);
    void TrackingManager.screen.view(routeNameToTrackingScreen(routeName));
    console.log('[ShotCoach][Navigator][screen-changed]', { routeName });
  }, []);

  const handleReady = useCallback(() => {
    if (!navigationRef.isReady()) {
      return;
    }
    const routeName = navigationRef.getCurrentRoute()?.name as keyof RootStackParamList;
    void TrackingManager.screen.view(routeNameToTrackingScreen(routeName ?? 'Home'));
  }, []);

  return (
    <NavigationContainer ref={navigationRef} onStateChange={handleStateChange} onReady={handleReady}>
      <AppNavigationShell />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  navigationShell: {
    backgroundColor: colors.background,
    flex: 1
  }
});
