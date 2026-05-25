import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/theme';

export function LoadingScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.logo}>ShotCoach AI</Text>
      <Text style={styles.tagline}>Your pocket photography coach</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  logo: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8
  },
  spinner: {
    marginTop: 32
  }
});
