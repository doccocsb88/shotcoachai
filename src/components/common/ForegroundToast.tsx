import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, typography } from '../../constants/theme';

interface Props {
  message?: string;
  subtitle?: string;
}

export function ForegroundToast({
  message = 'Creating your photo...',
  subtitle = 'Please keep this screen open until your result is ready.'
}: Props) {
  return (
    <View pointerEvents="none" style={styles.toast}>
      <View style={styles.textContainer}>
        <Text style={styles.message} numberOfLines={1} adjustsFontSizeToFit>{message}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit>{subtitle}</Text> : null}
      </View>
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
    paddingHorizontal: 8,
    paddingVertical: 10,
    ...shadows.button
  },
  textContainer: {
    flexShrink: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2
  },
  message: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center'
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center'
  }
});
