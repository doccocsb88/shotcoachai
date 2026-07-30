import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants/theme';

const sideSlotMinWidth = 56;
const androidTopInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

interface Props {
  title: string;
  /** Shown on the left (e.g. `Back`, `Done`). */
  leadingLabel: string;
  onLeadingPress: () => void;
  trailingLabel?: string;
  trailingColor?: string;
  onTrailingPress?: () => void;
}

/**
 * Top bar: leading action on the left, title visually centered. Intended under `SafeAreaView`
 * — use small vertical padding only (see `HomeScreen` nav).
 */
export function ScreenNavBar({ title, leadingLabel, onLeadingPress, trailingLabel, trailingColor, onTrailingPress }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.sideSlot}>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onLeadingPress}
          style={({ pressed }) => [styles.leadingPressable, pressed && styles.pressed]}
        >
          <Text style={styles.leadingLabel}>{leadingLabel}</Text>
        </Pressable>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.sideSlot, styles.sideSlotRight]}>
        {trailingLabel && onTrailingPress && (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={onTrailingPress}
            style={({ pressed }) => [styles.trailingPressable, pressed && styles.pressed]}
          >
            <Text style={[styles.trailingLabel, trailingColor ? { color: trailingColor } : undefined]}>{trailingLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: androidTopInset + 52,
    paddingHorizontal: spacing.md,
    paddingTop: androidTopInset
  },
  sideSlot: {
    minWidth: sideSlotMinWidth
  },
  leadingPressable: {
    alignSelf: 'flex-start',
    paddingVertical: 4
  },
  leadingLabel: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700'
  },
  sideSlotRight: {
    alignItems: 'flex-end',
  },
  trailingPressable: {
    alignSelf: 'flex-end',
    paddingVertical: 4
  },
  trailingLabel: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700'
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.65
  }
});
