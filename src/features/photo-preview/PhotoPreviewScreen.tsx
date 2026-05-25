import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows, typography } from '../../constants/theme';

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
      <Screen scroll={false}>
        <View style={styles.previewRoot}>
          <ScreenNavBar title="Preview Photo" leadingLabel="Back" onLeadingPress={onBack} />
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No photo selected</Text>
            <PrimaryButton title="Back" onPress={onBack} variant="secondary" />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.previewRoot}>
        <ScreenNavBar title="Preview Photo" leadingLabel="Back" onLeadingPress={onBack} />
        <ScrollView
          style={styles.previewScroll}
          contentContainerStyle={styles.previewScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <Text style={styles.subtitle}>Confirm the photo before sending it to AI analysis.</Text>
          <View style={[styles.imageFrame, { width: imageWidth, height: Math.min(imageHeight, 560) }]}>
            <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
          </View>
          <View style={styles.actions}>
            <PrimaryButton title="Analyze with AI" onPress={onAnalyze} />
            <PrimaryButton title="Choose another" onPress={onBack} variant="secondary" />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  previewRoot: {
    flex: 1
  },
  previewScroll: {
    flex: 1
  },
  previewScrollContent: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 8
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: 16
  },
  imageFrame: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card
  },
  image: {
    height: '100%',
    width: '100%'
  },
  actions: {
    gap: 12,
    marginTop: 24
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center'
  }
});
