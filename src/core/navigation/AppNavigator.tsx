import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useAnalysisStore } from '../store/analysisStore';
import { HomeScreen } from '../../features/home/HomeScreen';
import { PhotoPreviewScreen } from '../../features/photo-preview/PhotoPreviewScreen';
import { PoseAssistScreen } from '../../features/pose-assist/PoseAssistScreen';
import { AnalyzingScreen } from '../../features/analysis/AnalyzingScreen';
import { AnalysisResultScreen } from '../../features/result/AnalysisResultScreen';
import { GeneratedResultScreen } from '../../features/result/GeneratedResultScreen';
import { HistoryScreen } from '../../features/history/HistoryScreen';
import { PoseCollectionScreen } from '../../features/pose-collection/PoseCollectionScreen';
import { PoseDetailScreen } from '../../features/pose-collection/PoseDetailScreen';
import { PaywallScreen } from '../../features/paywall/PaywallScreen';
import { PrivacyPolicyScreen } from '../../features/privacy/PrivacyPolicyScreen';
import { colors, radius, shadows } from '../../constants/theme';
import { AnalysisResult } from '../../models/analysis';
import { PoseSeedItem } from '../../features/pose-collection/types';
import { PurchaseService } from '../../services/purchase/PurchaseService';
import { UserManager } from '../../services/user/UserManager';

type ScreenName =
  | 'home'
  | 'preview'
  | 'poseAssist'
  | 'analyzing'
  | 'analysisResult'
  | 'generatedResult'
  | 'history'
  | 'poseCollection'
  | 'poseDetail'
  | 'privacyPolicy';

export function AppNavigator() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [selectedPose, setSelectedPose] = useState<PoseSeedItem | null>(null);
  const [resultOpenedFromHistory, setResultOpenedFromHistory] = useState(false);
  const [generatedSuggestionIndex, setGeneratedSuggestionIndex] = useState(0);
  const [retakeReferenceUri, setRetakeReferenceUri] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [privacyPolicyReturnToMenu, setPrivacyPolicyReturnToMenu] = useState(false);
  const hydrateHistory = useAnalysisStore(state => state.hydrateHistory);
  const clearCurrent = useAnalysisStore(state => state.clearCurrent);
  const currentResult = useAnalysisStore(state => state.currentResult);
  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);
  useEffect(() => {
    void hydrateHistory();
    void UserManager.refresh();
  }, [hydrateHistory]);

  const goHome = useCallback(() => {
    clearCurrent();
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('home');
  }, [clearCurrent]);

  const openRetakeCapture = useCallback((referenceUri: string) => {
    clearCurrent();
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(referenceUri);
    setScreen('home');
  }, [clearCurrent]);

  const openAnalysisResult = useCallback((result?: AnalysisResult, openedFromHistory = false) => {
    if (result) {
      setCurrentResult(result);
    }
    setResultOpenedFromHistory(openedFromHistory);
    setGeneratedSuggestionIndex(0);
    setScreen('analysisResult');
  }, [setCurrentResult]);

  const openGeneratedResult = useCallback((suggestionIndex: number, result?: AnalysisResult, openedFromHistory = false) => {
    if (result) {
      setCurrentResult(result);
    }
    setGeneratedSuggestionIndex(suggestionIndex);
    setResultOpenedFromHistory(openedFromHistory);
    setScreen('generatedResult');
  }, [setCurrentResult]);

  const openResultFromHistory = useCallback((result: AnalysisResult) => {
    if (typeof result.selectedSuggestionIndex === 'number' && result.generatedImageUri) {
      openGeneratedResult(result.selectedSuggestionIndex, result, true);
      return;
    }
    openAnalysisResult(result, true);
  }, [openAnalysisResult, openGeneratedResult]);

  const openPreview = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('preview');
  }, []);
  const openPoseAssist = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('poseAssist');
  }, []);
  const openAnalyzing = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setScreen('analyzing');
  }, []);
  const openHome = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('home');
  }, []);
  const openHistory = useCallback(() => setScreen('history'), []);
  const openPoseCollection = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setScreen('poseCollection');
  }, []);
  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
    void UserManager.refresh();
  }, []);
  const openPrivacyPolicy = useCallback((returnToMenu = false) => {
    setPrivacyPolicyReturnToMenu(returnToMenu);
    setScreen('privacyPolicy');
  }, []);
  const closePrivacyPolicy = useCallback(() => {
    setScreen('home');
    if (privacyPolicyReturnToMenu) {
      setMenuOpen(true);
      setPrivacyPolicyReturnToMenu(false);
    }
  }, [privacyPolicyReturnToMenu]);
  const openPoseDetail = useCallback((pose: PoseSeedItem) => {
    setSelectedPose(pose);
    setScreen('poseDetail');
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  let content;

  if (screen === 'preview') {
    content = <PhotoPreviewScreen onBack={openHome} onAnalyze={openAnalyzing} />;
  } else if (screen === 'poseAssist') {
    content = <PoseAssistScreen onBack={openHome} onContinue={openPreview} />;
  } else if (screen === 'analyzing') {
    content = <AnalyzingScreen onComplete={openAnalysisResult} onBack={openPreview} onCancel={goHome} />;
  } else if (screen === 'analysisResult' && currentResult) {
    content = (
      <AnalysisResultScreen
        result={currentResult}
        onOpenPaywall={openPaywall}
        onBack={resultOpenedFromHistory ? openHistory : goHome}
        onSelectSuggestion={index => openGeneratedResult(index, undefined, resultOpenedFromHistory)}
      />
    );
  } else if (screen === 'generatedResult' && currentResult) {
    content = (
      <GeneratedResultScreen
        result={currentResult}
        suggestionIndex={generatedSuggestionIndex}
        onBack={resultOpenedFromHistory ? openHistory : goHome}
        onBackToAnalysis={() => setScreen('analysisResult')}
        onRetake={openRetakeCapture}
        openedFromHistory={resultOpenedFromHistory}
      />
    );
  } else if (screen === 'history') {
    content = <HistoryScreen onBack={openHome} onOpenResult={openResultFromHistory} />;
  } else if (screen === 'poseCollection') {
    content = <PoseCollectionScreen onBack={openHome} onOpenPose={openPoseDetail} />;
  } else if (screen === 'poseDetail' && selectedPose) {
    content = <PoseDetailScreen pose={selectedPose} onBack={openPoseCollection} />;
  } else if (screen === 'privacyPolicy') {
    content = <PrivacyPolicyScreen onBack={closePrivacyPolicy} />;
  } else {
    content = (
      <HomeScreen
        onOpenPreview={openPreview}
        onOpenPoseAssist={openPoseAssist}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenHistory={openHistory}
        onOpenPaywall={openPaywall}
        referenceImageUri={retakeReferenceUri}
      />
    );
  }

  const contentShell = screen === 'home' ? content : <SafeAreaView style={styles.safeContent}>{content}</SafeAreaView>;

  return (
    <>
      {contentShell}
      <SideMenu
        visible={menuOpen}
        onClose={closeMenu}
        onOpenPaywall={() => {
          openPaywall();
        }}
        onOpenPrivacyPolicy={() => {
          closeMenu();
          openPrivacyPolicy(true);
        }}
      />
      <Modal animationType="slide" visible={paywallOpen} onRequestClose={closePaywall}>
        <PaywallScreen onBack={closePaywall} />
      </Modal>
    </>
  );
}

function SideMenu({
  visible,
  onClose,
  onOpenPaywall,
  onOpenPrivacyPolicy
}: {
  visible: boolean;
  onClose: () => void;
  onOpenPaywall: () => void;
  onOpenPrivacyPolicy: () => void;
}) {
  const openUrl = async (url: string, fallbackUrl?: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      if (fallbackUrl) {
        try {
          await Linking.openURL(fallbackUrl);
          return;
        } catch {
          // Show one user-facing failure after the fallback is rejected too.
        }
      }
      Alert.alert('Could not open link', 'Please try again later.');
    }
  };

  const openSubscriptionManager = async () => {
    if (Platform.OS === 'ios') {
      try {
        await PurchaseService.manageSubscriptions();
        return;
      } catch {
        // Fall back to the App Store URL if the StoreKit sheet cannot open.
      }
    }

    const url =
      Platform.OS === 'ios'
        ? 'itms-apps://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions?package=co.q7labs.shotcoachai';
    await openUrl(url);
  };

  const openReview = async () => {
    const url =
      Platform.OS === 'ios'
        ? 'itms-apps://itunes.apple.com/app/id0000000000?action=write-review'
        : 'market://details?id=co.q7labs.shotcoachai&showAllReviews=true';
    const fallbackUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id0000000000?action=write-review'
        : 'https://play.google.com/store/apps/details?id=co.q7labs.shotcoachai';
    await openUrl(url, fallbackUrl);
  };

  const shareApp = async () => {
    await Share.share({
      message: 'Try ShotCoach AI for photo and pose coaching.'
    });
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.settingsRoot}>
        <SafeAreaView style={styles.settingsSafeArea}>
          <ScrollView
            contentContainerStyle={styles.settingsContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Settings</Text>
              <Pressable
                accessibilityLabel="Close settings"
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [styles.settingsCloseButton, pressed && styles.pressed]}
              >
                <Text style={styles.settingsCloseText}>×</Text>
              </Pressable>
            </View>

            <SettingsSection>
              <SettingsRow icon="store" title="Store" onPress={onOpenPaywall} />
              <SettingsRow
                icon="crown"
                title="Manage Subscription"
                onPress={openSubscriptionManager}
                isLast
              />
            </SettingsSection>

            <SettingsSection>
              <SettingsRow icon="star" title="Review App" onPress={openReview} />
              <SettingsRow icon="mail" title="Contact us" onPress={() => openUrl('mailto:support@shotcoach.ai')} />
              <SettingsRow icon="share" title="Share our app with friend" onPress={shareApp} />
              <SettingsRow icon="shield" title="Privacy policy" onPress={onOpenPrivacyPolicy} isLast />
            </SettingsSection>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function SettingsSection({ children }: { children: ReactNode }) {
  return <View style={styles.settingsSection}>{children}</View>;
}

function SettingsRow({
  icon,
  title,
  onPress,
  isLast = false
}: {
  icon: string;
  title: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, !isLast && styles.settingsRowBorder, pressed && styles.pressed]}
    >
      <SettingsIcon name={icon} />
      <Text style={styles.settingsRowTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.settingsChevron}>›</Text>
    </Pressable>
  );
}

function SettingsIcon({ name }: { name: string }) {
  const stroke = colors.primary;
  const common = { fill: 'none', stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 2.4 };

  return (
    <View style={styles.settingsIconWrap}>
      <Svg height={24} viewBox="0 0 24 24" width={24}>
        {name === 'store' ? (
          <>
            <Path {...common} d="M4 10h16" />
            <Path {...common} d="M5 10l1-5h12l1 5" />
            <Path {...common} d="M6 10v9h12v-9" />
            <Path {...common} d="M9 19v-5h6v5" />
          </>
        ) : name === 'crown' ? (
          <>
            <Path {...common} d="M4 18h16" />
            <Path {...common} d="M5 8l4 4 3-6 3 6 4-4-1.5 10h-11L5 8z" />
          </>
        ) : name === 'star' ? (
          <Path {...common} d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z" />
        ) : name === 'mail' ? (
          <>
            <Rect {...common} height={14} rx={3} width={18} x={3} y={5} />
            <Path {...common} d="M4 7l8 6 8-6" />
          </>
        ) : name === 'share' ? (
          <>
            <Path {...common} d="M8 12h8" />
            <Path {...common} d="M13 7l5 5-5 5" />
            <Path {...common} d="M5 5v14h14" />
          </>
        ) : (
          <>
            <Path {...common} d="M12 3l7 3v5c0 4.7-2.8 8.1-7 10-4.2-1.9-7-5.3-7-10V6l7-3z" />
            <Circle fill={stroke} cx={12} cy={12} r={2.2} />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContent: {
    backgroundColor: colors.background,
    flex: 1
  },
  settingsRoot: {
    backgroundColor: colors.background,
    flex: 1
  },
  settingsSafeArea: {
    flex: 1
  },
  settingsContent: {
    paddingBottom: 34,
    paddingHorizontal: 20
  },
  settingsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingTop: 18
  },
  settingsTitle: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '900'
  },
  settingsCloseButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  settingsCloseText: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '300',
    lineHeight: 46
  },
  settingsSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 22,
    overflow: 'hidden',
    ...shadows.soft
  },
  settingsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 22
  },
  settingsRowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  settingsIconWrap: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    marginRight: 16,
    width: 30
  },
  settingsRowTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800'
  },
  settingsChevron: {
    color: colors.textTertiary,
    fontSize: 30,
    fontWeight: '300',
    marginLeft: 10
  },
  pressed: {
    opacity: 0.72
  }
});
