import { ActivityIndicator, ImageBackground, StyleSheet, Text, View, Dimensions } from 'react-native';

import { colors } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../../assets/splash.png')} 
        style={styles.background}
        imageStyle={styles.imageStyle}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text style={styles.logo}>ShotCoach AI</Text>
          <Text style={styles.tagline}>Your pocket photography coach</Text>
          <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    backgroundColor: '#F6F8FE'
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  imageStyle: {
    resizeMode: 'cover'
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
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
