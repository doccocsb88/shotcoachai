import { ReactNode } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { LEGAL_URLS, SUPPORT_EMAIL } from '../../constants/legal';
import { colors, radius, shadows } from '../../constants/theme';
import { PurchaseService } from '../../services/purchase/PurchaseService';

const APP_STORE_ID = '6773058480';
const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

export type LegalDocument = {
  title: string;
  url: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenPaywall: () => void;
  onOpenLegal: (document: LegalDocument) => void;
};

export function SettingView({
  visible,
  onClose,
  onOpenPaywall,
  onOpenLegal
}: Props) {
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
        ? `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`
        : 'market://details?id=co.q7labs.shotcoachai&showAllReviews=true';
    const fallbackUrl =
      Platform.OS === 'ios'
        ? `${APP_STORE_URL}?action=write-review`
        : 'https://play.google.com/store/apps/details?id=co.q7labs.shotcoachai';
    await openUrl(url, fallbackUrl);
  };

  const shareApp = async () => {
    await Share.share({
      message: `Try ShotCoach AI for photo and pose coaching.\n${APP_STORE_URL}`,
      url: APP_STORE_URL
    });
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
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
              <SettingsRow icon="mail" title="Contact us" onPress={() => openUrl(`mailto:${SUPPORT_EMAIL}`)} />
              <SettingsRow icon="share" title="Share our app with friend" onPress={shareApp} />
              <SettingsRow
                icon="shield"
                title="Privacy Policy"
                onPress={() =>
                  onOpenLegal({
                    title: 'Privacy Policy',
                    url: LEGAL_URLS.privacyPolicy
                  })
                }
              />
              <SettingsRow
                icon="document"
                title="Terms of Use"
                onPress={() =>
                  onOpenLegal({
                    title: 'Terms of Use',
                    url: LEGAL_URLS.termsOfUse
                  })
                }
                isLast
              />
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
        ) : name === 'document' ? (
          <>
            <Path {...common} d="M7 3h7l4 4v14H7z" />
            <Path {...common} d="M14 3v5h5" />
            <Path {...common} d="M10 12h6" />
            <Path {...common} d="M10 16h6" />
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
