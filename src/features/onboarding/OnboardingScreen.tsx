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

import { colors, radius } from '../../constants/theme';
import { prepareAdsTrackingForOnboarding } from '../../services/ads/mobileAds';

/** Local onboarding art: page1 = Snap any photo, page2 = 3 smart tips, page3 = Before/after preview. */
const ONBOARDING_ASSETS = [
  require('../../../assets/onboarding/page1.jpg'),
  require('../../../assets/onboarding/page2.jpg'),
  require('../../../assets/onboarding/page3.jpg')
] as const;

function imageDisplayHeight(asset: (typeof ONBOARDING_ASSETS)[number], layoutWidth: number): number {
  const meta = Image.resolveAssetSource(asset);
  const intrinsicWidth = meta.width ?? 1;
  const intrinsicHeight = meta.height ?? 1;
  return Math.round((layoutWidth * intrinsicHeight) / intrinsicWidth);
}

interface Props {
  onDone: () => void;
}

const topPadding =
  Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 52;
/** Approximate bottom inset for home indicator (Expo Go: no RNCSafeAreaProvider). */
const bottomSafePadding = Platform.select({ ios: 28, android: 16, default: 16 }) ?? 16;

export function OnboardingScreen({ onDone }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    void prepareAdsTrackingForOnboarding();
  }, []);

  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(ONBOARDING_ASSETS.length - 1, index));
      scrollRef.current?.scrollTo({ x: clamped * windowWidth, animated: true });
      setPageIndex(clamped);
    },
    [windowWidth]
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / windowWidth);
      setPageIndex(Math.max(0, Math.min(ONBOARDING_ASSETS.length - 1, next)));
    },
    [windowWidth]
  );

  const handleContinue = useCallback(() => {
    if (pageIndex >= ONBOARDING_ASSETS.length - 1) {
      onDone();
      return;
    }
    goToPage(pageIndex + 1);
  }, [goToPage, onDone, pageIndex]);

  return (
    <View style={[styles.safe, { paddingTop: topPadding }]}>
      <View style={styles.column}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalPager}
          onMomentumScrollEnd={onScrollEnd}
        >
          {ONBOARDING_ASSETS.map((asset, index) => (
            <View key={index} style={[styles.pageColumn, { width: windowWidth }]}>
              <ScrollView
                style={styles.verticalScroll}
                contentContainerStyle={styles.verticalScrollContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                bounces
              >
                <Image
                  source={asset}
                  style={[
                    styles.pageImage,
                    { width: windowWidth, height: imageDisplayHeight(asset, windowWidth) }
                  ]}
                  resizeMode="contain"
                  accessibilityLabel={`Onboarding illustration ${index + 1} of ${ONBOARDING_ASSETS.length}`}
                />
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(12, bottomSafePadding) }]}>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueBtn,
              pageIndex === ONBOARDING_ASSETS.length - 1 && styles.continueBtnFinal,
              pressed && styles.pressed
            ]}
          >
            <Text
              style={[
                styles.continueBtnText,
                pageIndex === ONBOARDING_ASSETS.length - 1 && styles.continueBtnTextFinal
              ]}
            >
              {pageIndex === ONBOARDING_ASSETS.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>

          <View style={styles.dotsRow}>
            {ONBOARDING_ASSETS.map((_, i) => (
              <Pressable key={i} onPress={() => goToPage(i)} style={styles.dotHit}>
                <View style={[styles.dot, i === pageIndex ? styles.dotActive : styles.dotInactive]} />
              </Pressable>
            ))}
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
  column: {
    flex: 1,
    flexDirection: 'column'
  },
  horizontalPager: {
    flex: 1
  },
  pageColumn: {
    flex: 1
  },
  verticalScroll: {
    flex: 1
  },
  verticalScrollContent: {
    flexGrow: 1,
    paddingBottom: 16
  },
  pageImage: {
    backgroundColor: colors.primaryLight
  },
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 12
  },
  continueBtn: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 58,
    shadowColor: '#0B1B34',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2
  },
  continueBtnFinal: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: '#2F6BFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5
  },
  continueBtnText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800'
  },
  continueBtnTextFinal: {
    color: colors.surface
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingTop: 14
  },
  dotHit: {
    padding: 6
  },
  dot: {
    borderRadius: 5,
    height: 8,
    width: 8
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 22
  },
  dotInactive: {
    backgroundColor: colors.textTertiary
  },
  pressed: {
    opacity: 0.88
  }
});
