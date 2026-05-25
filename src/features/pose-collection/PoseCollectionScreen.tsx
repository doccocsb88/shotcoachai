import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows } from '../../constants/theme';
import { resolvePoseImageSource } from './poseImageSource';
import { PoseSeedItem } from './types';

interface Props {
  onBack: () => void;
  onOpenPose: (pose: PoseSeedItem) => void;
}

const poses = require('./pose_collection_seed.json') as PoseSeedItem[];

export function PoseCollectionScreen({ onBack, onOpenPose }: Props) {
  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <ScreenNavBar title="Pose Collection" leadingLabel="Back" onLeadingPress={onBack} />
        <View style={styles.listWrap}>
          <FlatList
            data={poses}
            keyExtractor={item => item.title}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpenPose(item)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.posePreview}>
                  <Image source={resolvePoseImageSource(item.sample_image_url)} style={styles.poseImage} resizeMode="cover" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.poseTitle}>{item.title}</Text>
                  <Text style={styles.focus}>{item.tags.join(' • ')}</Text>
                  <Text style={styles.cue}>{item.how_to_pose}</Text>
                  <Text style={styles.angle}>Camera: {item.camera_angle}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0
  },
  listWrap: {
    flex: 1,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  list: {
    gap: 12,
    paddingBottom: 36,
    paddingTop: 12
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    ...shadows.soft
  },
  posePreview: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    height: 112,
    overflow: 'hidden',
    width: 86
  },
  poseImage: {
    height: '100%',
    width: '100%'
  },
  cardText: {
    flex: 1,
    justifyContent: 'center'
  },
  poseTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  focus: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 6
  },
  cue: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  angle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 6
  },
  pressed: {
    opacity: 0.76
  }
});
