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
                <ActivityIndicator size="large" color={colors.primary} />
                {isLoadingAfter ? (
                  <Text style={styles.afterLoadingCaption}>Creating your AI edit…</Text>
                ) : null}
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
    width: '100%',
    height: '100%'
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
    backgroundColor: colors.primaryLight,
    justifyContent: 'center'
  },
  afterLoadingCaption: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12
  },
  badgePill: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    top: 14,
    zIndex: 4
  },
  badgeBefore: {
    backgroundColor: 'rgba(30, 41, 59, 0.78)',
    left: 14
  },
  badgeAfterPill: {
    backgroundColor: colors.primary,
    right: 14
  },
  badgeBeforeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800'
  },
  badgeAfterText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800'
  },
  dividerLine: {
    backgroundColor: colors.white,
    position: 'absolute',
    top: 0,
    width: 3,
    zIndex: 3
  },
  dividerHandle: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    elevation: 4,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: 48,
    zIndex: 4
  },
  dividerHandleArrows: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2
  },
  dividerHandleArrow: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '900'
  }
});
