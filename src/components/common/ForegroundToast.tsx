import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, typography } from '../../constants/theme';

interface Props {
  message?: string;
}

export function ForegroundToast({
  message = 'Keep the app open while AI is working.'
}: Props) {
  return (
    <View pointerEvents="none" style={styles.toast}>
      <Text style={styles.icon}>✨</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(8, 18, 34, 0.88)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 8,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadows.button
  },
  icon: {
    fontSize: 14
  },
  message: {
    color: colors.white,
    flexShrink: 1,
    fontSize: typography.caption,
    fontWeight: '800',
    lineHeight: 18
  }
});
