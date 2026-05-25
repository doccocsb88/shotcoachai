import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({ title, onPress, variant = 'primary', disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        variant === 'primary' && styles.primaryShadow,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' && styles.textOnPrimary,
          variant === 'secondary' && styles.textSecondary,
          variant === 'ghost' && styles.textGhost
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg
  },
  primaryShadow: {
    ...shadows.button
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.soft
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: radius.lg
  },
  disabled: {
    opacity: 0.45
  },
  pressed: {
    opacity: 0.88
  },
  text: {
    fontSize: typography.button,
    fontWeight: '700'
  },
  textOnPrimary: {
    color: colors.white
  },
  textSecondary: {
    color: colors.text
  },
  textGhost: {
    color: colors.primary
  }
});
