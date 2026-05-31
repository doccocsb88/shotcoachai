import { Image, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows } from '../../constants/theme';
import { resolvePoseImageSource } from './poseImageSource';
import { PoseSeedItem } from './types';

interface Props {
  pose: PoseSeedItem;
  onBack: () => void;
}

export function PoseDetailScreen({ pose, onBack }: Props) {
  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <ScreenNavBar title="Pose Detail" leadingLabel="Back" onLeadingPress={onBack} />
        <View style={styles.content}>
          <Image source={resolvePoseImageSource(pose.sample_image_url)} style={styles.heroImage} resizeMode="contain" />
          <View style={styles.overlay}>
            <Text style={styles.title}>{pose.title}</Text>
            <Text style={styles.tags}>{pose.tags.join(' • ')}</Text>

            <Text style={styles.sectionTitle}>How to pose</Text>
            <Text style={styles.sectionBody}>{pose.how_to_pose}</Text>

            <Text style={styles.sectionTitle}>Camera angle</Text>
            <Text style={styles.sectionBody}>{pose.camera_angle}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.select({ android: StatusBar.currentHeight ?? 0, ios: 0 })
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 0
  },
  heroImage: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    width: '100%'
  },
  overlay: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    bottom: 0,
    left: 20,
    padding: 16,
    position: 'absolute',
    right: 20,
    ...shadows.soft
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 31
  },
  tags: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 8
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 16
  },
  sectionBody: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 6
  }
});
