import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextStyle, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppWebView } from '../../components/common/AppWebView';
import { type LegalDocumentKey } from '../../constants/legal';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import {
  PurchaseProduct,
  PurchaseProductId,
  PurchaseService,
  purchaseProductIds
} from '../../services/purchase/PurchaseService';
import { PurchaseTracking } from '../../services/tracking/purchaseTracking';
import { UserManager } from '../../services/user/UserManager';

const paywallHeroImages = [
  require('../../../assets/paywall/carousel/hero-best-shot.png'),
  require('../../../assets/paywall/carousel/hero-compose.png'),
  require('../../../assets/paywall/carousel/hero-recipes.png'),
  require('../../../assets/paywall/carousel/hero-edit-tools.png')
] as const;
const paywallHeroHeightRatio = 1024 / 1536;
const heroLoopCopies = 3;
const heroAutoScrollIntervalMs = 2800;

type LegalDocument = {
  title: string;
  documentKey: LegalDocumentKey;
};

interface Props {
  onBack: () => void;
  paywallType: PaywallType;
}

export type PaywallType = 'Store' | 'DirectStore';

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
    description: 'One-time lifetime unlock.'
  }
];
const defaultProductId: PurchaseProductId = 'co.q7labs.shotcoachai.monthlytrial1';
const closeButtonTop = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 0) + spacing.sm;

export function PaywallScreen({ onBack, paywallType }: Props) {
  const { width } = useWindowDimensions();
  const isIpad = Platform.OS === 'ios' && width >= 768;
  const contentHorizontalPadding = isIpad ? 180 : spacing.lg;
  const benefitTextFontSize = isIpad ? 17 : 15;
  const impressionTrackedRef = useRef(false);
  const heroScrollRef = useRef<ScrollView | null>(null);
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [storeUnavailableMessage, setStoreUnavailableMessage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<PurchaseProductId>(defaultProductId);
  const [busyProductId, setBusyProductId] = useState<PurchaseProductId | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const [heroIndex, setHeroIndex] = useState<number>(paywallHeroImages.length);

  const heroCardWidth = width;
  const heroSideGap = 0;
  const heroSnapInterval = heroCardWidth + heroSideGap;
  const heroLoopImages = useMemo(() => {
    return Array.from({ length: heroLoopCopies }, () => [...paywallHeroImages]).flat();
  }, []);

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
              ? (Platform.OS === 'ios'
                ? 'No StoreKit products were returned. For local StoreKit purchases, run the app from Xcode with the AIPhotoCoach scheme so ShotCoachProducts.storekit is active.'
                : 'In-app purchases are not yet available on this platform.')
              : null
          );
        }
      })
      .catch(error => {
        void PurchaseTracking.productsLoadFailed(error);
        if (mounted) {
          setProductsLoaded(true);
          setStoreUnavailableMessage(error instanceof Error ? error.message : 'Could not load store products.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const initialOffset = heroSnapInterval * paywallHeroImages.length;
    const timeoutId = setTimeout(() => {
      heroScrollRef.current?.scrollTo({ x: initialOffset, animated: false });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [heroSnapInterval]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setHeroIndex(currentIndex => {
        const nextIndex = currentIndex + 1;
        heroScrollRef.current?.scrollTo({ x: nextIndex * heroSnapInterval, animated: true });
        return nextIndex;
      });
    }, heroAutoScrollIntervalMs);

    return () => clearInterval(intervalId);
  }, [heroSnapInterval]);

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
        if (paywallType === 'DirectStore') {
          onBack();
          return;
        }
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
        Alert.alert('No purchases found', 'No active ShotCoach Pro purchase was found for this account.');
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
      {Platform.OS === 'android' ? (
        <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      ) : null}
      <Pressable
        accessibilityLabel="Close store"
        accessibilityRole="button"
        onPress={() => {
          void PurchaseTracking.dismissed('close_button');
          onBack();
        }}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </Pressable>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: contentHorizontalPadding }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height: heroCardWidth * paywallHeroHeightRatio, marginLeft: -contentHorizontalPadding, width }]}>
          <ScrollView
            ref={heroScrollRef}
            contentContainerStyle={styles.heroCarouselContent}
            horizontal
            decelerationRate="fast"
            disableIntervalMomentum
            onMomentumScrollEnd={event => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const rawIndex = Math.round(offsetX / heroSnapInterval);
              const normalizedIndex = ((rawIndex % paywallHeroImages.length) + paywallHeroImages.length) % paywallHeroImages.length;
              const middleIndex = paywallHeroImages.length + normalizedIndex;

              setHeroIndex(middleIndex);

              if (rawIndex !== middleIndex) {
                heroScrollRef.current?.scrollTo({ x: middleIndex * heroSnapInterval, animated: false });
              }
            }}
            onScrollBeginDrag={() => {
              const offsetIndex = Math.round(heroIndex);
              setHeroIndex(offsetIndex);
            }}
            pagingEnabled={false}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={heroSnapInterval}
            style={styles.heroCarousel}
          >
            {heroLoopImages.map((source, index) => (
              <View
                key={`paywall-hero-${index}`}
                style={[
                  styles.heroCard,
                  {
                    height: heroCardWidth * paywallHeroHeightRatio,
                    marginRight: index === heroLoopImages.length - 1 ? heroSideGap : heroSideGap,
                    width: heroCardWidth
                  }
                ]}
              >
                <Image source={source} style={styles.heroImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.benefits}>
          <Benefit text="3 AI shooting directions per photo" textStyle={{ fontSize: benefitTextFontSize }} />
          <Benefit text="3 preview concepts for each suggestion" textStyle={{ fontSize: benefitTextFontSize }} />
          <Benefit text="Ultimate pose coaching for every shot" textStyle={{ fontSize: benefitTextFontSize }} />
        </View>

        <View style={styles.planList}>
          {!productsLoaded ? (
            <View style={styles.storeStatusCard}>
              <ActivityIndicator color={colors.primary} size="small" style={styles.storeLoadingIndicator} />
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
                    <Text style={styles.planTitle}>{formatPlanTitle(plan.product.displayName)}</Text>
                    <Text numberOfLines={1} style={styles.planSubtitle}>
                      {plan.description}
                    </Text>
                  </View>
                  <View style={styles.planMeta}>
                    {plan.badge ? (
                      <Text numberOfLines={1} style={styles.badge}>
                        {plan.badge}
                      </Text>
                    ) : (
                      <View style={styles.badgeSpacer} />
                    )}
                    <Text style={styles.planPrice}>{plan.product.displayPrice}</Text>
                  </View>
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
                documentKey: 'privacyPolicy'
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
                documentKey: 'termsOfUse'
              });
            }}
            style={({ pressed }) => [styles.legalLinkButton, pressed && styles.pressed]}
          >
            <Text style={styles.legalLinkText}>Terms of Use</Text>
          </Pressable>
        </View>

        <Text style={styles.termsText}>
          Payment will be charged to your {Platform.OS === 'ios' ? 'iTunes Account' : 'Google Play account'} at purchase confirmation.{'\n\n'}
          Subscription automatically renews within 24-hours prior to the end of the current subscription period.{'\n\n'}
          Subscription may be managed and auto-renewal may be turned off by going to the {Platform.OS === 'ios' ? 'Settings application' : 'Google Play Store'} after purchased.{'\n\n'}
          Any unused portion of a free trial period, if offered, will be forfeited when user purchases a subscription to that publication, where applicable.
        </Text>
      </ScrollView>
      <AppWebView
        title={legalDocument?.title ?? ''}
        documentKey={legalDocument?.documentKey}
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

function Benefit({ text, textStyle }: { text: string; textStyle?: TextStyle }) {
  return (
    <View style={styles.benefitRow}>
      <CircleCheck />
      <Text style={[styles.benefitText, textStyle]}>{text}</Text>
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

function formatPlanTitle(displayName: string) {
  return displayName.replace(/^ShotCoach Pro\s+/i, '');
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    paddingBottom: spacing.xl,
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
    ...shadows.button
  },
  heroCarousel: {
    overflow: 'visible'
  },
  heroCarouselContent: {
    paddingLeft: 0,
    paddingRight: 0
  },
  heroCard: {
    borderRadius: 0,
    overflow: 'hidden'
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
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 98,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
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
  planMeta: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: 72,
    paddingRight: 2,
    position: 'relative'
  },
  planTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  badgeSpacer: {
    minHeight: 0
  },
  badge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    right: 0,
    top: -2
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
  storeLoadingIndicator: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm
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
