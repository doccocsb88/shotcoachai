import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { CaretLeft } from 'phosphor-react-native';

import { colors, radius, shadows } from '../../../constants/theme';

const androidTopInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

interface Props {
  title: string;
  breadcrumbLabel: string;
  onBack: () => void;
  onOpenCollection?: () => void;
}

/**
 * Pose Detail top chrome: back-only nav row + collection breadcrumb + full-width title.
 * Keeps long pose titles out of the shared AppScreenHeader (single-line centered title).
 */
export function PoseDetailScreenHeader({ title, breadcrumbLabel, onBack, onOpenCollection }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <CaretLeft size={20} color={colors.text} weight="bold" />
        </Pressable>
      </View>
      <View style={styles.meta}>
        {onOpenCollection ? (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenCollection}
            style={({ pressed }) => [styles.breadcrumb, pressed && styles.pressed]}
          >
            <Text style={styles.breadcrumbText} numberOfLines={1}>
              {breadcrumbLabel}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.breadcrumbStatic} numberOfLines={1}>
            {breadcrumbLabel}
          </Text>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: 8
  },
  navRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: androidTopInset + 56,
    paddingHorizontal: 20,
    paddingTop: androidTopInset
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
  meta: {
    gap: 8,
    paddingHorizontal: 20
  },
  breadcrumb: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  breadcrumbStatic: {
    alignSelf: 'flex-start',
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  breadcrumbText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800'
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30
  },
  pressed: {
    opacity: 0.65
  }
});
