import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/theme';

export function LoadingScreen() {
  return (
    <ImageBackground 
      source={require('../../../assets/splash.png')} 
      style={styles.root}
      resizeMode="cover"
    >
      <Text style={styles.logo}>ShotCoach AI</Text>
      <Text style={styles.tagline}>Your pocket photography coach</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    width: '100%',
    height: '100%'
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
