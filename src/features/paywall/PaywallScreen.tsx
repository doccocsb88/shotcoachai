import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppWebView } from '../../components/common/AppWebView';
import { LEGAL_URLS } from '../../constants/legal';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import {
  PurchaseProduct,
  PurchaseProductId,
  PurchaseService,
  purchaseProductIds
} from '../../services/purchase/PurchaseService';
import { PurchaseTracking } from '../../services/tracking/purchaseTracking';
import { UserManager } from '../../services/user/UserManager';

const paywallHeroImage = require('../../../assets/paywall/paywall-hero.png');
const paywallHeroHeightRatio = 1024 / 1536;

type LegalDocument = {
  title: string;
  url: string;
};

interface Props {
  onBack: () => void;
}

type PaywallPlan = {
  id: PurchaseProductId;
  badge?: string;
  description?: string;
};

type DisplayPlan = {
  product: PurchaseProduct;
  badge?: string;
  description: string;
};

const configuredPlans: PaywallPlan[] = [
  {
    id: 'co.q7labs.shotcoachai.weekly1',
    description: 'Full access for a flexible week.'
  },
  {
    id: 'co.q7labs.shotcoachai.monthlytrial1',
    badge: 'Popular',
    description: '3 days free, then renews monthly.'
  },
  {
    id: 'co.q7labs.shotcoachai.lifetime1',
    description: 'One-time unlock with lifetime access.'
  }
];
const defaultProductId: PurchaseProductId = 'co.q7labs.shotcoachai.monthlytrial1';
const closeButtonTop = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 0) + spacing.sm;

export function PaywallScreen({ onBack }: Props) {
  const { width } = useWindowDimensions();
  const impressionTrackedRef = useRef(false);
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [storeUnavailableMessage, setStoreUnavailableMessage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<PurchaseProductId>(defaultProductId);
  const [busyProductId, setBusyProductId] = useState<PurchaseProductId | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!impressionTrackedRef.current) {
      impressionTrackedRef.current = true;
      void PurchaseTracking.paywallImpression();
    }

    PurchaseService.getProducts()
      .then(storeProducts => {
        void PurchaseTracking.productsLoaded(storeProducts);
        if (mounted) {
          setProducts(storeProducts);
          setProductsLoaded(true);
          setStoreUnavailableMessage(
            storeProducts.length === 0
              ? 'No StoreKit products were returned. For local StoreKit purchases, run the app from Xcode with the AIPhotoCoach scheme so ShotCoachProducts.storekit is active.'
              : null
          );
        }
      })
      .catch(error => {
        void PurchaseTracking.productsLoadFailed(error);
        if (mounted) {
          setProductsLoaded(true);
          setStoreUnavailableMessage(error instanceof Error ? error.message : 'Could not load StoreKit products.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const productById = useMemo(() => {
    return products.reduce<Partial<Record<PurchaseProductId, PurchaseProduct>>>((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
  }, [products]);

  const displayPlans = useMemo<DisplayPlan[]>(() => {
    return configuredPlans.flatMap(plan => {
      const product = productById[plan.id];
      return product ? [{ product, badge: plan.badge, description: plan.description ?? product.description }] : [];
    });
  }, [productById]);

  useEffect(() => {
    if (displayPlans.length > 0 && !displayPlans.some(plan => plan.product.id === selectedProductId)) {
      setSelectedProductId(displayPlans.find(plan => plan.product.id === defaultProductId)?.product.id ?? displayPlans[0].product.id);
    }
  }, [displayPlans, selectedProductId]);

  const selectedPlan = displayPlans.find(plan => plan.product.id === selectedProductId) ?? displayPlans[0];
  const processing = busyProductId !== null || restoring;

  const handleSelectPlan = async (plan: DisplayPlan, source: 'plan_card' | 'primary_cta') => {
    setSelectedProductId(plan.product.id);
    void PurchaseTracking.itemSelected(plan.product, source);
    setBusyProductId(plan.product.id);
    try {
      void PurchaseTracking.purchaseStarted(plan.product, source);
      const result = await PurchaseService.purchase(plan.product.id);

      if (result.status === 'purchased') {
        void PurchaseTracking.purchaseCompleted(plan.product, result);
        await UserManager.markPremiumActive();
        Alert.alert('Purchase complete', 'ShotCoach Pro is unlocked on this device.');
      } else if (result.status === 'pending') {
        void PurchaseTracking.purchaseResolved(plan.product, result);
        Alert.alert('Purchase pending', 'The purchase is waiting for approval or payment completion.');
      } else if (result.status === 'cancelled') {
        void PurchaseTracking.purchaseResolved(plan.product, result);
        Alert.alert('Purchase cancelled', 'No charge was made.');
      } else {
        void PurchaseTracking.purchaseResolved(plan.product, result);
      }
    } catch (error) {
      void PurchaseTracking.purchaseFailed(plan.product.id, error);
      Alert.alert('Purchase failed', error instanceof Error ? error.message : 'Could not complete purchase.');
    } finally {
      setBusyProductId(null);
    }
  };

  const handleRestore = async () => {
    void PurchaseTracking.restoreStarted();
    setRestoring(true);
    try {
      const result = await PurchaseService.restore();
      void PurchaseTracking.restoreCompleted(result);
      if (result.activeEntitlements.length > 0) {
        await UserManager.markPremiumActive();
        Alert.alert('Purchases restored', 'Your active ShotCoach Pro purchase is restored.');
      } else {
        Alert.alert('No purchases found', 'No active ShotCoach Pro purchase was found for this Apple ID.');
      }
    } catch (error) {
      void PurchaseTracking.restoreFailed(error);
      Alert.alert('Restore failed', error instanceof Error ? error.message : 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityLabel="Close store"
        accessibilityRole="button"
        onPress={() => {
          void PurchaseTracking.dismissed();
          onBack();
        }}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height: width * paywallHeroHeightRatio, width }]}>
          <Image source={paywallHeroImage} style={styles.heroImage} resizeMode="cover" />
        </View>

        <View style={styles.benefits}>
          <Benefit text="3 AI shooting directions per photo" />
          <Benefit text="3 preview concepts for each suggestion" />
          <Benefit text="Ultimate pose coaching for every shot" />
        </View>

        <View style={styles.planList}>
          {!productsLoaded ? (
            <View style={styles.storeStatusCard}>
              <Text style={styles.storeStatusTitle}>Loading StoreKit products...</Text>
              <Text style={styles.storeStatusBody}>Fetching product names and prices from the store.</Text>
            </View>
          ) : displayPlans.length === 0 ? (
            <View style={styles.storeStatusCard}>
              <Text style={styles.storeStatusTitle}>No products available</Text>
              <Text style={styles.storeStatusBody}>
                {storeUnavailableMessage ??
                  `StoreKit did not return any of the configured products: ${purchaseProductIds.join(', ')}`}
              </Text>
            </View>
          ) : (
            displayPlans.map(plan => {
              const disabled = processing;
              const selected = plan.product.id === selectedProductId;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={plan.product.id}
                  disabled={disabled}
                  onPress={() => handleSelectPlan(plan, 'plan_card')}
                  style={({ pressed }) => [
                    styles.planCard,
                    selected && styles.planCardSelected,
                    disabled && styles.disabledPlanCard,
                    pressed && styles.pressed
                  ]}
                >
                  <View style={styles.planCopy}>
                    <View style={styles.planTitleRow}>
                      <Text style={styles.planTitle}>{plan.product.displayName}</Text>
                      {plan.badge ? <Text style={styles.badge}>{plan.badge}</Text> : null}
                    </View>
                    <Text style={styles.planSubtitle}>{plan.description}</Text>
                  </View>
                  <Text style={styles.planPrice}>{plan.product.displayPrice}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={processing || !selectedPlan}
          onPress={() => {
            if (selectedPlan) {
              void handleSelectPlan(selectedPlan, 'primary_cta');
            }
          }}
          style={({ pressed }) => [styles.primaryCta, !selectedPlan && styles.disabledCta, pressed && styles.pressed]}
        >
          <Text style={styles.primaryCtaText}>Continue</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={processing}
          onPress={handleRestore}
          style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}
        >
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>

        <View style={styles.legalLinksRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setLegalDocument({
                title: 'Privacy Policy',
                url: LEGAL_URLS.privacyPolicy
              });
            }}
            style={({ pressed }) => [styles.legalLinkButton, pressed && styles.pressed]}
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalLinkSeparator}>•</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setLegalDocument({
                title: 'Terms of Use',
                url: LEGAL_URLS.termsOfUse
              });
            }}
            style={({ pressed }) => [styles.legalLinkButton, pressed && styles.pressed]}
          >
            <Text style={styles.legalLinkText}>Terms of Use</Text>
          </Pressable>
        </View>

        <Text style={styles.termsText}>
          Payment will be charged to iTunes Account at purchase confirmation.{'\n\n'}
          Subscription automatically renews within 24-hours prior to the end of the current subscription period.{'\n\n'}
          Subscription may be managed and auto-renewal may be turned off by going to the Settings application after purchased.{'\n\n'}
          Any unused portion of a free trial period, if offered, will be forfeited when user purchases a subscription to that publication, where applicable.
        </Text>
      </ScrollView>
      <AppWebView
        title={legalDocument?.title ?? ''}
        url={legalDocument?.url ?? ''}
        visible={legalDocument !== null}
        onClose={() => setLegalDocument(null)}
      />
      {processing ? (
        <View style={styles.progressOverlay} pointerEvents="auto">
          <View style={styles.progressHub}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.progressTitle}>{restoring ? 'Restoring purchases' : 'Processing purchase'}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <CircleCheck />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function CircleCheck() {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Circle cx={12} cy={12} fill={colors.primaryLight} r={10} />
      <Path
        d="M7.5 12.2l2.8 2.8 6.2-6.5"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: 0
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 34, 0.64)',
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
    top: closeButtonTop,
    width: 38,
    zIndex: 5
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 32,
    marginTop: -2
  },
  hero: {
    marginLeft: -spacing.lg,
    ...shadows.button
  },
  heroImage: {
    height: '100%',
    width: '100%'
  },
  benefits: {
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  benefitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  benefitText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '700'
  },
  planList: {
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  planCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.soft
  },
  planCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  disabledPlanCard: {
    opacity: 0.58
  },
  planCopy: {
    flex: 1
  },
  planTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  planTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  planSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4
  },
  planPrice: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right'
  },
  storeStatusCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.soft
  },
  storeStatusTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  storeStatusBody: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 6
  },
  primaryCta: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 56,
    ...shadows.button
  },
  disabledCta: {
    opacity: 0.5
  },
  primaryCtaText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  restoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48
  },
  restoreText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800'
  },
  legalLinksRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    marginTop: -spacing.xs
  },
  legalLinkButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  legalLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  legalLinkSeparator: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '700'
  },
  termsText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center'
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 34, 0.18)',
    justifyContent: 'center',
    padding: spacing.lg
  },
  progressHub: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    minWidth: 190,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.button
  },
  progressTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.md,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.72
  }
});
