import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors } from '../../constants/theme';

interface Props {
  onBack: () => void;
  onAnalyze: () => void;
}

export function PhotoPreviewScreen({ onBack, onAnalyze }: Props) {
  const photo = useAnalysisStore(state => state.currentPhoto);
  const { width } = useWindowDimensions();
  const imageWidth = width - 40;
  const imageHeight = photo ? imageWidth * (photo.height / photo.width) : imageWidth * 1.25;

  if (!photo) {
    return (
      <Screen>
        <Text style={styles.title}>No photo selected</Text>
        <PrimaryButton title="Back" onPress={onBack} variant="secondary" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Preview Photo</Text>
      <Text style={styles.subtitle}>Confirm the photo before sending it to AI analysis.</Text>

      <View style={[styles.imageFrame, { width: imageWidth, height: Math.min(imageHeight, 560) }]}>
        <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Analyze with AI" onPress={onAnalyze} />
        <PrimaryButton title="Choose another" onPress={onBack} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 20
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8
  },
  imageFrame: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: 24,
    overflow: 'hidden'
  },
  image: {
    height: '100%',
    width: '100%'
  },
  actions: {
    gap: 12,
    marginTop: 24
  }
});
