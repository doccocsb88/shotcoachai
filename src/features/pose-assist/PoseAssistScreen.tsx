import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { PoseOverlay } from '../../components/overlay/PoseOverlay';
import { useAnalysisStore } from '../../core/store/analysisStore';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';

type TemplateId = 'pose_1' | 'pose_2' | 'pose_3';

const templates: Array<{ id: TemplateId; title: string; subtitle: string }> = [
  { id: 'pose_1', title: 'Pose 1', subtitle: 'Balanced — squared shoulders' },
  { id: 'pose_2', title: 'Pose 2', subtitle: 'Dynamic — slight twist' },
  { id: 'pose_3', title: 'Pose 3', subtitle: 'Arms up — follow-through' }
];

export function PoseAssistScreen({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const photo = useAnalysisStore(state => state.currentPhoto);
  const selected = useAnalysisStore(state => state.poseAiSelectedTemplateId);
  const setSelected = useAnalysisStore(state => state.setPoseAiSelectedTemplateId);

  if (!photo) {
    return (
      <Screen scroll={false}>
        <View style={styles.root}>
          <ScreenNavBar title="AI Pose" leadingLabel="Back" onLeadingPress={onBack} />
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No photo selected</Text>
            <PrimaryButton title="Back" onPress={onBack} variant="secondary" />
          </View>
        </View>
      </Screen>
    );
  }

  const activeTemplate = (selected as TemplateId | undefined) ?? 'pose_1';

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <ScreenNavBar title="AI Pose" leadingLabel="Back" onLeadingPress={onBack} />
        <View style={styles.content}>
          <Text style={styles.subtitle}>Pick an overlay guide, then continue to analysis.</Text>

          <View style={styles.imageFrame}>
            <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
            <PoseOverlay templateId={activeTemplate} />
          </View>

          <View style={styles.templatesRow}>
            {templates.map(t => {
              const isActive = t.id === activeTemplate;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setSelected(t.id)}
                  style={({ pressed }) => [
                    styles.templateCard,
                    isActive && styles.templateCardActive,
                    pressed && styles.pressed
                  ]}
                >
                  <View style={styles.templatePreview}>
                    <PoseOverlay templateId={t.id} opacity={0.65} />
                  </View>
                  <Text style={styles.templateTitle}>{t.title}</Text>
                  <Text style={styles.templateSubtitle} numberOfLines={1}>
                    {t.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton title="Continue" onPress={onContinue} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.md
  },
  imageFrame: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    height: 420,
    overflow: 'hidden',
    width: '100%',
    ...shadows.card
  },
  image: {
    height: '100%',
    width: '100%'
  },
  templatesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
    marginTop: spacing.md
  },
  templateCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    padding: 10,
    ...shadows.soft
  },
  templateCardActive: {
    borderColor: colors.primary
  },
  templatePreview: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    height: 72,
    overflow: 'hidden',
    width: '100%'
  },
  templateTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8
  },
  templateSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.75
  }
});

