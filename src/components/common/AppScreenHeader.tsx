import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretLeft } from 'phosphor-react-native';

import { useNavBarTopInset } from '../../constants/layout';
import { colors, shadows } from '../../constants/theme';

const sideSlotMinWidth = 56;

interface Props {
  title: string;
  onBack: () => void;
  trailingLabel?: string;
  trailingColor?: string;
  onTrailingPress?: () => void;
}

/**
 * Standard screen header: circular back button, centered bold title.
 * Matches Photo Preview / AI Edit tool screens.
 */
export function AppScreenHeader({ title, onBack, trailingLabel, trailingColor, onTrailingPress }: Props) {
  const navBarTopInset = useNavBarTopInset();

  return (
    <View style={[styles.header, { paddingTop: navBarTopInset, minHeight: navBarTopInset + 56 }]}>
      <Pressable
        accessibilityRole="button"
        hitSlop={10}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <CaretLeft size={20} color={colors.text} weight="bold" />
      </Pressable>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.sideSlot, styles.sideSlotRight]}>
        {trailingLabel && onTrailingPress ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={onTrailingPress}
            style={({ pressed }) => [styles.trailingPressable, pressed && styles.pressed]}
          >
            <Text style={[styles.trailingLabel, trailingColor ? { color: trailingColor } : undefined]}>
              {trailingLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
    ...shadows.soft
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    paddingHorizontal: 10,
    textAlign: 'center'
  },
  sideSlot: {
    minWidth: sideSlotMinWidth
  },
  sideSlotRight: {
    alignItems: 'flex-end'
  },
  trailingPressable: {
    alignSelf: 'flex-end',
    paddingVertical: 4
  },
  trailingLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.65
  }
});
