import { ImageBackground, Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';

import { colors, radius } from '../../../constants/theme';
import { Pose } from '../../../models/pose';

interface Props {
  pose: Pose;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function PoseCard({ pose, onPress, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      <ImageBackground source={pose.browsingImage.source} style={styles.image} imageStyle={styles.imageInner}>
        <View style={styles.overlay}>
          <Text style={styles.title} numberOfLines={1}>{pose.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{pose.subtitle}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 0.72,
    backgroundColor: '#0B1B34',
    borderRadius: radius.md,
    overflow: 'hidden'
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  imageInner: {
    borderRadius: radius.md
  },
  overlay: {
    backgroundColor: 'rgba(8, 16, 24, 0.62)',
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 10
  },
  title: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    marginBottom: 2
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 15
  },
  pressed: {
    opacity: 0.72
  }
});
