import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppScreenHeader } from '../../components/common/AppScreenHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors, radius, spacing } from '../../constants/theme';
import { Pose } from '../../models/pose';

interface Props {
  pose: Pose;
  onBack: () => void;
  onUsePose: (pose: Pose) => void;
}

function chipLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

export function PoseDetailScreen({ pose, onBack, onUsePose }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const heroHeight = Math.min(280, Math.round(windowHeight * 0.34));
  const chips = [
    chipLabel(pose.primaryLocation),
    pose.subjectCount === 1 ? 'Solo' : pose.subjectCount === 2 ? 'Couple' : `${pose.subjectCount}`,
    ...pose.subjectTypes.filter(type => type !== 'any').map(chipLabel),
    chipLabel(pose.bodyPosition)
  ];

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <AppScreenHeader title="Pose Detail" onBack={onBack} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroFrame, { height: heroHeight }]}>
            <Image source={pose.browsingImage.source} style={styles.hero} resizeMode="cover" />
          </View>
          <Text style={styles.title}>{pose.title}</Text>
          <View style={styles.chipRow}>
            {chips.map(chip => (
              <View key={chip} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>How to pose</Text>
          <Text style={styles.sectionBody}>{pose.howToPose}</Text>

          <Text style={styles.sectionTitle}>Camera</Text>
          <Text style={styles.sectionBody}>{pose.cameraGuidance}</Text>

          {pose.overlayImage ? (
            <View style={styles.overlayPreviewWrap}>
              <Text style={styles.sectionTitle}>Overlay guide</Text>
              <View style={styles.overlayPreview}>
                <Image source={pose.overlayImage.source} style={styles.overlayImage} resizeMode="contain" />
              </View>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            title={pose.overlayImage ? 'Use this pose' : 'Guide coming soon'}
            onPress={() => onUsePose(pose)}
            disabled={!pose.overlayImage}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 20
  },
  heroFrame: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '100%'
  },
  hero: {
    height: '100%',
    width: '100%'
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 16
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  chip: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  chipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 20
  },
  sectionBody: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 6
  },
  overlayPreviewWrap: {
    marginTop: 4
  },
  overlayPreview: {
    backgroundColor: '#111827',
    borderRadius: radius.md,
    height: 160,
    marginTop: 10,
    overflow: 'hidden'
  },
  overlayImage: {
    height: '100%',
    width: '100%'
  },
  footer: {
    paddingBottom: spacing.lg,
    paddingHorizontal: 20,
    paddingTop: 8
  }
});
