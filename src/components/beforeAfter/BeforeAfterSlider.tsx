import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { colors } from '../../constants/theme';

const SPLIT_MIN = 0.06;
const SPLIT_MAX = 0.94;
const glassBlue = '#2F6BFF';
const glassBorder = 'rgba(255, 255, 255, 0.72)';

export interface BeforeAfterSliderProps {
  beforeUri: string;
  afterUri: string | null;
  isLoadingAfter: boolean;
}

export function BeforeAfterSlider({ beforeUri, afterUri, isLoadingAfter }: BeforeAfterSliderProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [splitRatio, setSplitRatio] = useState(0.5);

  useEffect(() => {
    if (afterUri && !isLoadingAfter) {
      setSplitRatio(0.5);
    }
  }, [afterUri, isLoadingAfter]);

  const clampSplit = useCallback((ratio: number) => {
    return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, ratio));
  }, []);

  const updateSplitFromLocation = useCallback(
    (locationX: number) => {
      const w = layout.width;
      if (w <= 0) return;
      setSplitRatio(clampSplit(locationX / w));
    },
    [clampSplit, layout.width]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          updateSplitFromLocation(evt.nativeEvent.locationX);
        },
        onPanResponderMove: evt => {
          updateSplitFromLocation(evt.nativeEvent.locationX);
        }
      }),
    [updateSplitFromLocation]
  );

  const splitPx = layout.width > 0 ? splitRatio * layout.width : 0;

  return (
    <View
      style={styles.comparisonRoot}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width, height });
      }}
      {...panResponder.panHandlers}
    >
      {layout.width > 0 ? (
        <>
          <View style={[StyleSheet.absoluteFill, styles.comparisonImageClip]}>
            {afterUri && !isLoadingAfter ? (
              <Image
                source={{ uri: afterUri }}
                style={{ width: layout.width, height: layout.height }}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.afterLoadingFill, { width: layout.width, height: layout.height }]}>
                <View style={styles.loadingCrosshair}>
                  <View style={styles.loadingCrosshairHorizontal} />
                  <View style={styles.loadingCrosshairVertical} />
                </View>
                <ActivityIndicator size="large" color={glassBlue} />
                {isLoadingAfter ? (
                  <Text style={styles.afterLoadingCaption}>Making your photo look better…</Text>
                ) : null}
                <Text style={styles.afterLoadingCode}>This usually takes a moment</Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.beforeClip,
              {
                width: splitPx,
                height: layout.height
              }
            ]}
            pointerEvents="none"
          >
            <Image
              source={{ uri: beforeUri }}
              style={{ width: layout.width, height: layout.height }}
              resizeMode="cover"
            />
          </View>

          <View style={[styles.badgePill, styles.badgeBefore]} pointerEvents="none">
            <Text style={styles.badgeBeforeText}>Before</Text>
          </View>
          <View style={[styles.badgePill, styles.badgeAfterPill]} pointerEvents="none">
            <Text style={styles.badgeAfterText}>After</Text>
          </View>

          {layout.width > 0 ? (
            <>
              <View
                pointerEvents="none"
                style={[
                  styles.dividerLine,
                  {
                    left: splitPx - 1.5,
                    height: layout.height
                  }
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.dividerHandle,
                  {
                    left: splitPx - 24,
                    top: layout.height / 2 - 24
                  }
                ]}
              >
                <View style={styles.dividerHandleLine} />
                <View style={styles.dividerHandleArrows}>
                  <Text style={styles.dividerHandleArrow}>←</Text>
                  <Text style={styles.dividerHandleArrow}>→</Text>
                </View>
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  comparisonRoot: {
    flex: 1,
    height: '100%',
    width: '100%'
  },
  comparisonImageClip: {
    overflow: 'hidden'
  },
  beforeClip: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0
  },
  afterLoadingFill: {
    alignItems: 'center',
    backgroundColor: '#EEF5FF',
    borderLeftColor: 'rgba(255,255,255,0.7)',
    borderLeftWidth: 1,
    justifyContent: 'center'
  },
  loadingCrosshair: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    marginBottom: 18,
    position: 'relative',
    width: 52
  },
  loadingCrosshairHorizontal: {
    backgroundColor: glassBlue,
    height: 1,
    position: 'absolute',
    width: 52
  },
  loadingCrosshairVertical: {
    backgroundColor: glassBlue,
    height: 52,
    position: 'absolute',
    width: 1
  },
  afterLoadingCaption: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center'
  },
  afterLoadingCode: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center'
  },
  badgePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    top: 12,
    zIndex: 4
  },
  badgeBefore: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderColor: glassBorder,
    left: 12
  },
  badgeAfterPill: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(47, 107, 255, 0.35)',
    right: 12
  },
  badgeBeforeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  badgeAfterText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  dividerLine: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    position: 'absolute',
    top: 0,
    width: 3,
    zIndex: 3
  },
  dividerHandle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: glassBorder,
    borderRadius: 24,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'absolute',
    width: 46,
    zIndex: 4
  },
  dividerHandleLine: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    bottom: 0,
    left: 21.5,
    position: 'absolute',
    top: 0,
    width: 3
  },
  dividerHandleArrows: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  dividerHandleArrow: {
    color: glassBlue,
    fontSize: 12,
    fontWeight: '900'
  }
});
