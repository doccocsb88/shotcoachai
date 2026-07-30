import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors, shadows, typography } from '../../constants/theme';

interface Props {
  message?: string;
  subtitle?: string;
}

const isIOS = Platform.OS === 'ios';

export function ForegroundToast({
  message = 'Creating your photo...',
  subtitle = 'Please keep this screen open until your result is ready.'
}: Props) {
  return (
    <View pointerEvents="none" style={styles.toast}>
      <Text style={styles.toastMeta}>AI GENERATION ACTIVE</Text>
      <View style={styles.textContainer}>
        <Text style={styles.message} numberOfLines={isIOS ? 1 : undefined} adjustsFontSizeToFit={isIOS}>
          {message}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={isIOS ? 2 : undefined} adjustsFontSizeToFit={isIOS}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(255,255,255,0.98)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'column',
    maxWidth: '95%',
    paddingHorizontal: 18,
    paddingVertical: 12,
    ...shadows.button
  },
  toastMeta: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  textContainer: {
    alignItems: 'center',
    gap: 3
  },
  message: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
    textAlign: 'center'
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center'
  }
});
