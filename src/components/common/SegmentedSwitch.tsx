import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../../constants/theme';

export function SegmentedSwitch<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.root} accessibilityRole="tablist">
      {options.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.pressed]}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 6
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10
  },
  itemActive: {
    backgroundColor: colors.primaryLight
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800'
  },
  labelActive: {
    color: colors.primary
  },
  pressed: {
    opacity: 0.75
  }
});

