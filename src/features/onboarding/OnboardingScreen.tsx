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

const HERO_PAGE_1 = require('../../../assets/onboarding/page1.jpg');
const HERO_PAGE_2 = require('../../../assets/onboarding/page2.jpg');
const HERO_PAGE_3 = require('../../../assets/onboarding/page3.jpg');
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
    title: 'AI camera guidance for every better shot',
    subtitle: 'Get instant cues for angle, framing, perspective, pose, and light before you press shutter.',
    hero: HERO_PAGE_1
  },
  {
    title: 'AI edit tools to refine the photo fast',
    subtitle: 'Enhance details, rebalance light, adjust color, improve composition, and clean up the final look.',
    hero: HERO_PAGE_2
  },
  {
    title: 'Photo Recipes for consistent looks',
    subtitle: 'Pick a recipe mood and apply a polished style while keeping your original composition and identity.',
    hero: HERO_PAGE_3
  }
];

const topPadding = 0;
const bottomSafePadding = Platform.select({ ios: 28, android: 16, default: 16 }) ?? 16;

export function OnboardingScreen({ onDone }: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    void prepareAdsTrackingForOnboarding();
  }, []);

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

  const horizontalPadding = Math.min(28, Math.max(20, windowWidth * 0.06));
  const heroHeight = Math.min(Math.max(windowHeight * 0.6, 440), 620);
  const fadeFooterOverlap = Math.max(116, bottomSafePadding + 98);
  const bottomFadeHeight = Math.max(280, windowHeight - heroHeight + 52);

  return (
    <View style={[styles.safe, { paddingTop: topPadding }]}>
      <View style={styles.column}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalPager}
          onMomentumScrollEnd={onScrollEnd}
        >
          {ONBOARDING_PAGES.map((page, index) => {
            const asset = Image.resolveAssetSource(page.hero);

            return (
              <View
                key={page.title}
                style={[
                  styles.page,
                  {
                    width: windowWidth
                  }
                ]}
              >
                <View style={[styles.heroShell, { height: heroHeight }]}>
                  <View style={styles.heroImage}>
                    <Image
                      source={page.hero}
                      style={[styles.heroImageContent, { width: windowWidth, height: windowWidth * (asset.height / asset.width) }]}
                      resizeMode="stretch"
                    />
                  </View>
                </View>
                <LinearGradient
                  colors={['rgba(247, 245, 240, 0)', '#F7F5F0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[
                    styles.pageBottomFade,
                    {
                      bottom: -fadeFooterOverlap,
                      height: bottomFadeHeight
                    }
                  ]}
                  pointerEvents="none"
                />

                <View style={[styles.copyBlock, { paddingHorizontal: horizontalPadding }]}>
                  <Text style={styles.title}>{page.title}</Text>
                  <Text style={styles.subtitle}>{page.subtitle}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(12, bottomSafePadding), paddingHorizontal: horizontalPadding }]}>
          <View style={styles.dotsRow}>
            {ONBOARDING_PAGES.map((_, i) => (
              <Pressable key={i} onPress={() => goToPage(i)} style={styles.dotHit}>
                <View style={[styles.dot, i === pageIndex ? styles.dotActive : styles.dotInactive]} />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
          >
            <Text style={styles.continueBtnText}>
              {pageIndex === ONBOARDING_PAGES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: '#F7F5F0',
    flex: 1
  },
  column: {
    flex: 1
  },
  horizontalPager: {
    flex: 1
  },
  page: {
    flex: 1,
    justifyContent: 'flex-start',
    overflow: 'visible',
    paddingBottom: 12
  },
  pageBottomFade: {
    elevation: 3,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 3
  },
  heroShell: {
    marginTop: 0,
    zIndex: 0
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'visible',
    position: 'relative'
  },
  heroImageContent: {
    left: 0,
    position: 'absolute',
    top: 0
  },
  copyBlock: {
    alignItems: 'center',
    elevation: 4,
    marginTop: 'auto',
    paddingBottom: 8,
    paddingHorizontal: 6,
    paddingTop: 18,
    zIndex: 4
  },
  title: {
    color: '#18253F',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
    textAlign: 'center'
  },
  subtitle: {
    color: '#6F7785',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center'
  },
  footer: {
    paddingTop: 4
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 16
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
  continueBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.9
  }
});
