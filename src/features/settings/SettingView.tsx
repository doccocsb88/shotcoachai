import { ReactNode } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Storefront, Crown, Star, Envelope, ShareNetwork, ShieldCheck, FileText, CaretRight, X } from 'phosphor-react-native';

import { LEGAL_URLS, SUPPORT_EMAIL } from '../../constants/legal';
import { navBarBottomPadding, navBarTopPadding } from '../../constants/layout';
import { colors, radius, spacing } from '../../constants/theme';
import { PurchaseService } from '../../services/purchase/PurchaseService';
import { TrackingManager } from '../../services/tracking/TrackingManager';

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
  children?: ReactNode;
};

export function SettingView({
  visible,
  onClose,
  onOpenPaywall,
  onOpenLegal,
  children
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
    const url = Platform.OS === 'ios' ? APP_STORE_URL : 'https://play.google.com/store/apps/details?id=co.q7labs.shotcoachai';
    await Share.share({
      message: `Try ShotCoach AI for photo and pose coaching.\n${url}`,
      url: url
    });
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.settingsRoot}>
        <ScrollView
          contentContainerStyle={styles.settingsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.settingsHeader, { paddingTop: navBarTopPadding }]}>
              <View style={styles.headerSideSlot} />
              <Text style={styles.settingsTitle}>Settings</Text>
              <Pressable
                accessibilityLabel="Close settings"
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [styles.settingsCloseButton, pressed && styles.pressed]}
              >
                <X size={32} color={colors.text} weight="bold" />
              </Pressable>
            </View>

            <SettingsSection>
              <SettingsRow icon="store" title="Store" onPress={() => { void TrackingManager.settings.action('store'); onOpenPaywall(); }} />
              <SettingsRow
                icon="crown"
                title="Manage Subscription"
                onPress={() => { void TrackingManager.settings.action('manage_subscription'); void openSubscriptionManager(); }}
                isLast
              />
            </SettingsSection>

            <SettingsSection>
              <SettingsRow icon="star" title="Review App" onPress={() => { void TrackingManager.settings.action('review'); void openReview(); }} />
              <SettingsRow icon="mail" title="Contact us" onPress={() => { void TrackingManager.settings.action('contact'); void openUrl(`mailto:${SUPPORT_EMAIL}`); }} />
              <SettingsRow icon="share" title="Share our app with friend" onPress={() => { void TrackingManager.settings.action('share'); void shareApp(); }} />
              <SettingsRow
                icon="shield"
                title="Privacy Policy"
                onPress={() => {
                  void TrackingManager.settings.action('privacy_policy');
                  onOpenLegal({
                    title: 'Privacy Policy',
                    url: LEGAL_URLS.privacyPolicy
                  });
                }}
              />
              <SettingsRow
                icon="document"
                title="Terms of Use"
                onPress={() => {
                  void TrackingManager.settings.action('terms_of_use');
                  onOpenLegal({
                    title: 'Terms of Use',
                    url: LEGAL_URLS.termsOfUse
                  });
                }}
                isLast
              />
            </SettingsSection>
        </ScrollView>
      </View>
      {children}
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
      <CaretRight size={24} color={colors.textTertiary} weight="bold" />
    </Pressable>
  );
}

function SettingsIcon({ name }: { name: string }) {
  const stroke = colors.primary;

  return (
    <View style={styles.settingsIconWrap}>
      {name === 'store' ? (
        <Storefront size={26} color={stroke} weight="regular" />
      ) : name === 'crown' ? (
        <Crown size={26} color={stroke} weight="regular" />
      ) : name === 'star' ? (
        <Star size={26} color={stroke} weight="regular" />
      ) : name === 'mail' ? (
        <Envelope size={26} color={stroke} weight="regular" />
      ) : name === 'share' ? (
        <ShareNetwork size={26} color={stroke} weight="regular" />
      ) : name === 'document' ? (
        <FileText size={26} color={stroke} weight="regular" />
      ) : (
        <ShieldCheck size={26} color={stroke} weight="regular" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  settingsRoot: {
    backgroundColor: colors.background,
    flex: 1
  },
  settingsContent: {
    paddingBottom: 34,
    paddingHorizontal: spacing.lg
  },
  settingsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingBottom: navBarBottomPadding
  },
  headerSideSlot: {
    height: 44,
    width: 44
  },
  settingsTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
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
    shadowColor: '#0B1B34',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2
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
