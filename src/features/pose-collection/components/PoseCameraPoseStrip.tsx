import { useEffect, useRef } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '../../../constants/theme';
import { Pose } from '../../../models/pose';

interface Props {
  poses: Pose[];
  selectedPoseId: string;
  onSelectPose: (pose: Pose) => void;
}

const THUMB_WIDTH = 52;

export function PoseCameraPoseStrip({ poses, selectedPoseId, onSelectPose }: Props) {
  const listRef = useRef<FlatList<Pose>>(null);

  useEffect(() => {
    const selectedIndex = poses.findIndex(entry => entry.id === selectedPoseId);
    if (selectedIndex < 0) return;

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        animated: true,
        index: selectedIndex,
        viewPosition: 0.5
      });
    });
  }, [poses, selectedPoseId]);

  if (poses.length <= 1) {
    return null;
  }

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={poses}
      keyExtractor={item => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      onScrollToIndexFailed={info => {
        listRef.current?.scrollToOffset({
          animated: true,
          offset: info.averageItemLength * info.index
        });
      }}
      renderItem={({ item }) => {
        const isSelected = item.id === selectedPoseId;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelectPose(item)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={[styles.thumbFrame, isSelected && styles.thumbFrameSelected]}>
              <Image source={item.browsingImage.source} style={styles.thumbImage} resizeMode="cover" />
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 7,
    paddingHorizontal: 2
  },
  item: {
    width: THUMB_WIDTH
  },
  thumbFrame: {
    aspectRatio: 0.72,
    backgroundColor: '#0B1B34',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden'
  },
  thumbFrameSelected: {
    borderColor: colors.warning,
    borderWidth: 2
  },
  thumbImage: {
    height: '100%',
    width: '100%'
  },
  pressed: {
    opacity: 0.88
  }
});
