import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows } from '../../constants/theme';
import { prepareAdsTrackingForOnboarding } from '../../services/ads/mobileAds';
import { TrackingManager } from '../../services/tracking/TrackingManager';

const HERO_PAGE_1 = require('../../../assets/onboarding/page1.jpg');
const HERO_PAGE_2 = require('../../../assets/onboarding/page2.png');
const HERO_PAGE_3 = require('../../../assets/onboarding/page3.png');

interface Props {
  onDone: () => void;
}

interface OnboardingPage {
  title: string;
  subtitle: string;
  hero: ReturnType<typeof require>;
}

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: 'Live coaching with pose references',
    subtitle: 'Get framing cues and AI pose ideas right in your camera while you shoot.',
    hero: HERO_PAGE_1
  },
  {
    title: 'Browse pose collections',
    subtitle: 'Explore curated pose demos and match your shot to an on-screen outline.',
    hero: HERO_PAGE_2
  },
  {
    title: 'Photo Recipes for consistent looks',
    subtitle: 'Pick a recipe mood and apply a polished grade while keeping your composition and identity.',
    hero: HERO_PAGE_3
  }
];

const bottomSafePadding = Platform.select({ ios: 28, android: 16, default: 16 }) ?? 16;
const statusBarInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

export function OnboardingScreen({ onDone }: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    void prepareAdsTrackingForOnboarding();
    void TrackingManager.onboarding.started();
    void TrackingManager.onboarding.pageViewed(0, ONBOARDING_PAGES.length);
  }, []);

  useEffect(() => {
    void TrackingManager.onboarding.pageViewed(pageIndex, ONBOARDING_PAGES.length);
  }, [pageIndex]);

  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(ONBOARDING_PAGES.length - 1, index));
      scrollRef.current?.scrollTo({ x: clamped * windowWidth, animated: true });
      setPageIndex(clamped);
    },
    [windowWidth]
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / windowWidth);
      setPageIndex(Math.max(0, Math.min(ONBOARDING_PAGES.length - 1, next)));
    },
    [windowWidth]
  );

  const handleContinue = useCallback(() => {
    if (pageIndex >= ONBOARDING_PAGES.length - 1) {
      onDone();
      return;
    }
    goToPage(pageIndex + 1);
  }, [goToPage, onDone, pageIndex]);

  const isIpad = Platform.OS === 'ios' && windowWidth >= 768;
  const horizontalPadding = isIpad ? 180 : Math.min(28, Math.max(20, windowWidth * 0.06));
  const continueButtonWidth = isIpad ? Math.min(windowWidth * 0.5, 680) : undefined;
  const heroHeight = Math.min(Math.max(windowHeight * 0.62, 440), 620);
  const heroFadeHeight = Math.max(96, Math.round(heroHeight * 0.18));
  const skipTop = statusBarInset + (Platform.OS === 'ios' ? 12 : 8);
  const activePage = ONBOARDING_PAGES[pageIndex];

  return (
    <View style={styles.safe}>
      <Pressable
        accessibilityRole="button"
        onPress={onDone}
        style={({ pressed }) => [styles.skipButton, { right: horizontalPadding, top: skipTop }, pressed && styles.pressed]}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.column}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={[styles.horizontalPager, { height: heroHeight }]}
          onMomentumScrollEnd={onScrollEnd}
        >
          {ONBOARDING_PAGES.map((page) => (
            <View key={page.title} style={[styles.heroPage, { width: windowWidth, height: heroHeight }]}>
              <Image
                source={page.hero}
                style={[
                  styles.heroImage,
                  isIpad ? { marginHorizontal: horizontalPadding, borderRadius: radius.lg } : null
                ]}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(247, 250, 255, 0)', colors.background]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.heroFade, { height: heroFadeHeight }]}
                pointerEvents="none"
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.contentArea}>
          <View style={[styles.copyBlock, { paddingHorizontal: horizontalPadding }]}>
            <Text style={styles.title}>{activePage.title}</Text>
            <Text style={styles.subtitle}>{activePage.subtitle}</Text>
          </View>

          <View style={styles.contentSpacer} />

          <View
            style={[
              styles.footerPanel,
              { paddingBottom: Math.max(12, bottomSafePadding), paddingHorizontal: horizontalPadding }
            ]}
          >
            <View style={styles.dotsRow}>
              {ONBOARDING_PAGES.map((_, i) => (
                <Pressable key={i} onPress={() => goToPage(i)} style={styles.dotHit}>
                  <View style={[styles.dot, i === pageIndex ? styles.dotActive : styles.dotInactive]} />
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.continueBtn,
                isIpad && styles.continueBtnIpad,
                continueButtonWidth ? { width: continueButtonWidth } : null,
                pressed && styles.pressed
              ]}
            >
              <Text style={styles.continueBtnText}>
                {pageIndex === ONBOARDING_PAGES.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    zIndex: 10
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  column: {
    flex: 1
  },
  horizontalPager: {
    flexGrow: 0
  },
  heroPage: {
    overflow: 'hidden',
    position: 'relative'
  },
  heroImage: {
    height: '100%',
    width: '100%'
  },
  heroFade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0
  },
  copyBlock: {
    alignItems: 'center',
    paddingBottom: 4,
    paddingHorizontal: 6,
    paddingTop: 6
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 32,
    textAlign: 'center'
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center'
  },
  contentArea: {
    flex: 1
  },
  contentSpacer: {
    flex: 1,
    minHeight: 8
  },
  footerPanel: {
    flexGrow: 0
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 16,
    paddingTop: 8
  },
  dotHit: {
    padding: 6
  },
  dot: {
    borderRadius: 999,
    height: 8,
    width: 8
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24
  },
  dotInactive: {
    backgroundColor: '#C5CEDC'
  },
  continueBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: 'center',
    minHeight: 58,
    ...shadows.button
  },
  continueBtnIpad: {
    alignSelf: 'center',
    paddingHorizontal: 36
  },
  continueBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.9
  }
});
