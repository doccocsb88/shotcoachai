import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../../constants/theme';
import { OverlayData } from '../../models/analysis';
import { OverlayGuide } from './OverlayGuide';

interface Props {
  imageUri: string;
  showOverlay: boolean;
  overlayData?: OverlayData;
  width: number;
  height: number;
}

export function GuideImage({ imageUri, showOverlay, overlayData, width, height }: Props) {
  return (
    <View style={[styles.frame, { width, height }]}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      {showOverlay && <OverlayGuide width={width} height={height} overlayData={overlayData} />}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden'
  },
  image: {
    height: '100%',
    width: '100%'
  }
});
