import { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../../../constants/theme';

const MIN_OPACITY = 0.25;
const MAX_OPACITY = 0.85;
const THUMB_SIZE = 22;
const THUMB_RADIUS = THUMB_SIZE / 2;

interface Props {
  value: number;
  onChange: (value: number) => void;
}

function clampOpacity(value: number): number {
  return Math.max(MIN_OPACITY, Math.min(MAX_OPACITY, value));
}

function ratioFromOpacity(value: number): number {
  return (clampOpacity(value) - MIN_OPACITY) / (MAX_OPACITY - MIN_OPACITY);
}

function opacityFromRatio(ratio: number): number {
  return clampOpacity(MIN_OPACITY + Math.max(0, Math.min(1, ratio)) * (MAX_OPACITY - MIN_OPACITY));
}

export function OverlayOpacitySlider({ value, onChange }: Props) {
  const trackWrapRef = useRef<View>(null);
  const trackMetricsRef = useRef({ pageX: 0, width: 0 });
  const onChangeRef = useRef(onChange);
  const [trackWidth, setTrackWidth] = useState(0);

  onChangeRef.current = onChange;

  const syncTrackMetrics = useCallback(() => {
    trackWrapRef.current?.measureInWindow((pageX, _pageY, width) => {
      if (width <= 0) return;
      trackMetricsRef.current = { pageX, width };
      setTrackWidth(width);
    });
  }, []);

  const updateFromPageX = useCallback((pageX: number) => {
    const { pageX: trackPageX, width } = trackMetricsRef.current;
    if (width <= 0) return;

    const touchOffset = pageX - trackPageX;
    const clampedOffset = Math.max(0, Math.min(width, touchOffset));
    onChangeRef.current(opacityFromRatio(clampedOffset / width));
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: event => {
        syncTrackMetrics();
        updateFromPageX(event.nativeEvent.pageX);
      },
      onPanResponderMove: event => {
        updateFromPageX(event.nativeEvent.pageX);
      }
    })
  ).current;

  const handleLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      syncTrackMetrics();
    },
    [syncTrackMetrics]
  );

  const fillRatio = ratioFromOpacity(value);
  const thumbOffset = Math.max(0, Math.min(trackWidth, fillRatio * trackWidth)) - THUMB_RADIUS;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Opacity</Text>
      <View
        ref={trackWrapRef}
        collapsable={false}
        style={styles.trackWrap}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View style={[styles.fill, trackWidth > 0 ? { width: fillRatio * trackWidth } : { width: `${fillRatio * 100}%` }]} />
        </View>
        <View
          style={[
            styles.thumb,
            trackWidth > 0 ? { transform: [{ translateX: thumbOffset }] } : { left: `${fillRatio * 100}%`, marginLeft: -THUMB_RADIUS }
          ]}
        />
      </View>
      <Text style={styles.value}>{Math.round(clampOpacity(value) * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0
  },
  label: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    width: 48
  },
  trackWrap: {
    flex: 1,
    height: 36,
    justifyContent: 'center'
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    height: 4,
    overflow: 'hidden'
  },
  fill: {
    backgroundColor: colors.primary,
    height: '100%'
  },
  thumb: {
    backgroundColor: colors.white,
    borderRadius: THUMB_RADIUS,
    height: THUMB_SIZE,
    left: 0,
    position: 'absolute',
    top: 7,
    width: THUMB_SIZE
  },
  value: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    width: 36
  }
});
