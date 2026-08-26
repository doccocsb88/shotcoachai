import { ImageBackground, Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';

import { colors, radius } from '../../../constants/theme';
import { PoseAsset } from '../../../models/pose';

interface Props {
  title: string;
  subtitle: string;
  poseCount: number;
  coverImage: PoseAsset;
  kindLabel: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function CollectionCard({ title, subtitle, poseCount, coverImage, kindLabel, onPress, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      <ImageBackground source={coverImage.source} style={styles.image} imageStyle={styles.imageInner}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{kindLabel}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{poseCount}</Text>
          </View>
        </View>
        <View style={styles.overlay}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
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
    justifyContent: 'space-between'
  },
  imageInner: {
    borderRadius: radius.md
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800'
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 16, 24, 0.72)',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  countText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800'
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
