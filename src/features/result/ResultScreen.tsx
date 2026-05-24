import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BeforeAfterSlider } from '../../components/beforeAfter/BeforeAfterSlider';
import {
  CameraOutlineIcon,
  ChevronLeftIcon,
  DownloadOutlineIcon,
  MoreHorizontalIcon,
  ShareOutlineIcon
} from '../../components/icons/ResultActionIcons';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows, typography } from '../../constants/theme';
import {
  AnalysisResult,
  getStoredGenerationUri,
  mergeSuggestionGeneration
} from '../../models/analysis';
import { evaluateEditedImageQuality, generateEditedImage } from '../../services/openai/generateImage';
import { saveImageToLibrary, shareImage } from '../../services/share/shareGuide';
import { useAnalysisStore } from '../../core/store/analysisStore';

interface Props {
  result: AnalysisResult;
  onBack: () => void;
}

export function ResultScreen({ result, onBack }: Props) {
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUri, setGeneratedImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);
  const addRecentResult = useAnalysisStore(state => state.addRecentResult);

  useEffect(() => {
    setSelectedSuggestionIndex(null);
    setGeneratedImageUri(null);
    setIsGenerating(false);
  }, [result.analysisId]);

  const selectSuggestion = (index: number) => {
    setSelectedSuggestionIndex(index);
    const stored = getStoredGenerationUri(result, index);
    if (stored) {
      setGeneratedImageUri(stored);
    } else {
      setGeneratedImageUri(null);
    }
  };

  const handleGenerate = async () => {
    if (selectedSuggestionIndex === null) return;
    const selected = result.suggestions[selectedSuggestionIndex];
    if (!selected) return;
    if (getStoredGenerationUri(result, selectedSuggestionIndex)) {
      return;
    }

    try {
      setIsGenerating(true);
      const uri = await generateEditedImage(
        selected.image_prompt,
        result.originalImageUri,
        result.originalImageMimeType
      );
      let qualityEvaluation;
      try {
        qualityEvaluation = await evaluateEditedImageQuality({
          originalImageUri: result.originalImageUri,
          generatedImageUri: uri,
          originalImageMimeType: result.originalImageMimeType,
          selectedDirection: {
            suggestion: selected,
            recipe: result.generationRecipes?.[selectedSuggestionIndex]
          }
        });
      } catch {
        qualityEvaluation = undefined;
      }

      const updatedResult = mergeSuggestionGeneration(result, selectedSuggestionIndex, uri, qualityEvaluation);
      setCurrentResult(updatedResult);
      setGeneratedImageUri(uri);
      await addRecentResult(updatedResult);
    } catch (error) {
      Alert.alert('Generation failed', error instanceof Error ? error.message : 'Could not generate the edited image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const showBeforeAfterLayout = generatedImageUri !== null || isGenerating;

  const handleSave = async () => {
    if (!generatedImageUri || isGenerating) return;
    try {
      setBusy(true);
      await saveImageToLibrary(generatedImageUri);
      Alert.alert('Saved', 'AI edited image saved to your library.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Could not save this image.');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!generatedImageUri || isGenerating) return;
    try {
      setBusy(true);
      await shareImage(generatedImageUri);
    } catch (error) {
      Alert.alert('Share failed', error instanceof Error ? error.message : 'Could not share this image.');
    } finally {
      setBusy(false);
    }
  };

  const hasStoredForSelection =
    selectedSuggestionIndex !== null && Boolean(getStoredGenerationUri(result, selectedSuggestionIndex));

  const selectedSuggestion =
    selectedSuggestionIndex !== null ? result.suggestions[selectedSuggestionIndex] : undefined;

  const tipCardTitle = isGenerating ? 'Applying tip…' : 'Tip Applied';
  const tipCardDescription = useMemo(() => {
    if (isGenerating) {
      return 'Hang tight while we apply your chosen direction.';
    }
    if (selectedSuggestion?.concept?.trim()) {
      return selectedSuggestion.concept.trim();
    }
    if (selectedSuggestion?.changes?.length) {
      return selectedSuggestion.changes.join(' ');
    }
    return 'Natural light, warmer tones, improved contrast.';
  }, [isGenerating, selectedSuggestion]);

  const saveDisabled = busy || isGenerating || !generatedImageUri;
  const shareDisabled = busy || isGenerating || !generatedImageUri;
  const headerActionsDisabled = isGenerating;

  const returnToSuggestionPicker = () => {
    setGeneratedImageUri(null);
    setSelectedSuggestionIndex(null);
  };

  const tipDetailBody = useMemo(() => {
    if (!selectedSuggestion) return tipCardDescription;
    const parts = [selectedSuggestion.concept, ...(selectedSuggestion.changes ?? [])].filter(Boolean);
    return parts.length ? parts.join('\n\n') : tipCardDescription;
  }, [selectedSuggestion, tipCardDescription]);

  const openTipDetail = () => {
    Alert.alert(tipCardTitle, tipDetailBody);
  };

  const openHeaderMenu = () => {
    Alert.alert('ShotCoach AI', undefined, [
      { text: 'Another direction', onPress: returnToSuggestionPicker },
      { text: 'Go home', onPress: onBack },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  if (showBeforeAfterLayout) {
    return (
      <Screen scroll={false}>
        <View style={styles.resultChromeRoot}>
          <View style={styles.resultHeader}>
            <Pressable
              accessibilityLabel="Back to creative directions"
              accessibilityRole="button"
              disabled={headerActionsDisabled}
              onPress={returnToSuggestionPicker}
              style={({ pressed }) => [
                styles.headerIconCircle,
                headerActionsDisabled && styles.headerIconDisabled,
                pressed && !headerActionsDisabled && styles.pressed
              ]}
            >
              <ChevronLeftIcon size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.resultHeaderTitle} numberOfLines={1}>
              ShotCoach AI
            </Text>
            <Pressable
              accessibilityLabel="Open menu"
              accessibilityRole="button"
              disabled={headerActionsDisabled}
              onPress={openHeaderMenu}
              style={({ pressed }) => [
                styles.headerIconCircle,
                headerActionsDisabled && styles.headerIconDisabled,
                pressed && !headerActionsDisabled && styles.pressed
              ]}
            >
              <MoreHorizontalIcon size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.comparisonSection}>
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonSliderHost}>
                <BeforeAfterSlider
                  beforeUri={result.originalImageUri}
                  afterUri={generatedImageUri}
                  isLoadingAfter={isGenerating && !generatedImageUri}
                />
              </View>
              <View style={styles.tipCardFloat} pointerEvents="box-none">
                <View style={styles.tipCard}>
                  <View style={styles.tipCardIconBubble}>
                    <Text style={styles.tipCardIconSparkle}>✨</Text>
                  </View>
                  <View style={styles.tipCardTextBlock}>
                    <Text style={styles.tipCardTitle}>{tipCardTitle}</Text>
                    <Text style={styles.tipCardBody} numberOfLines={2}>
                      {tipCardDescription}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel="Tip detail"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={openTipDetail}
                    style={({ pressed }) => [styles.tipDetailLink, pressed && styles.pressed]}
                  >
                    <Text style={styles.tipDetailLinkText}>Detail</Text>
                    <Text style={styles.tipDetailChevron}>›</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionDock}>
            <View style={styles.bottomActionsRow}>
              <Pressable
                accessibilityLabel="Retake — return home"
                accessibilityRole="button"
                disabled={headerActionsDisabled}
                onPress={onBack}
                style={({ pressed }) => [
                  styles.sideActionButton,
                  headerActionsDisabled && styles.headerIconDisabled,
                  pressed && !headerActionsDisabled && styles.pressed
                ]}
              >
                <CameraOutlineIcon size={20} color={colors.text} />
                <Text style={styles.sideActionLabel}>Retake</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Save edited photo"
                accessibilityRole="button"
                onPress={handleSave}
                disabled={saveDisabled}
                style={({ pressed }) => [
                  styles.saveFab,
                  saveDisabled && styles.saveButtonDisabled,
                  pressed && !saveDisabled && styles.pressed
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <DownloadOutlineIcon size={22} color={colors.white} />
                    <Text style={styles.saveFabLabel}>Save</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                accessibilityLabel="Share edited photo"
                accessibilityRole="button"
                disabled={shareDisabled}
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.sideActionButton,
                  shareDisabled && styles.headerIconDisabled,
                  pressed && !shareDisabled && styles.pressed
                ]}
              >
                <ShareOutlineIcon size={20} color={colors.text} />
                <Text style={styles.sideActionLabel}>Share</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityLabel="Choose another creative direction"
              accessibilityRole="button"
              disabled={busy || isGenerating}
              onPress={returnToSuggestionPicker}
              style={({ pressed }) => [styles.anotherDirectionRow, pressed && styles.pressed]}
            >
              <Text style={styles.anotherDirectionText}>↔ Another direction</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.analysisRoot}>
        <ScreenNavBar title="Analysis Result" leadingLabel="Done" onLeadingPress={onBack} />

        <ScrollView
          style={styles.analysisScroll}
          contentContainerStyle={styles.analysisScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assessment</Text>
            <Text style={styles.body}>{result.overallAssessment}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Creative Direction</Text>
            {result.suggestions.map((suggestion, index) => {
              const isSelected = selectedSuggestionIndex === index;
              const hasSavedEdit = Boolean(getStoredGenerationUri(result, index));
              return (
                <Pressable
                  key={index}
                  onPress={() => selectSuggestion(index)}
                  style={[styles.suggestionCard, isSelected && styles.suggestionCardSelected]}
                >
                  <View style={styles.suggestionHeader}>
                    <Text style={[styles.suggestionTitle, isSelected && styles.textSelected]}>{suggestion.title}</Text>
                    <View style={styles.suggestionHeaderRight}>
                      {hasSavedEdit ? <Text style={styles.savedBadge}>Saved</Text> : null}
                      {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                  </View>
                  <Text style={styles.suggestionConcept}>{suggestion.concept}</Text>
                  {(suggestion.composition ?? '').length > 0 ? (
                    <Text style={styles.suggestionMeta}>
                      <Text style={styles.suggestionMetaLabel}>Composition: </Text>
                      {suggestion.composition}
                    </Text>
                  ) : null}
                  {(suggestion.camera_angle ?? '').length > 0 ? (
                    <Text style={styles.suggestionMeta}>
                      <Text style={styles.suggestionMetaLabel}>Camera: </Text>
                      {suggestion.camera_angle}
                    </Text>
                  ) : null}
                  <View style={styles.changesList}>
                    {suggestion.changes.map((change, cIndex) => (
                      <Text key={cIndex} style={styles.changeItem}>
                        • {change}
                      </Text>
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.analysisFooter}>
          <PrimaryButton
            title="Generate Edit"
            onPress={handleGenerate}
            disabled={selectedSuggestionIndex === null || hasStoredForSelection}
            style={styles.generateEditButton}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultChromeRoot: {
    backgroundColor: colors.background,
    flex: 1
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 10
  },
  headerIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...shadows.soft
  },
  headerIconDisabled: {
    opacity: 0.4
  },
  resultHeaderTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    marginHorizontal: 12,
    textAlign: 'center'
  },
  comparisonSection: {
    flex: 1,
    marginBottom: 4,
    minHeight: 200,
    paddingHorizontal: 16
  },
  comparisonCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.card
  },
  comparisonSliderHost: {
    ...StyleSheet.absoluteFillObject
  },
  tipCardFloat: {
    bottom: 14,
    left: 14,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 14
  },
  tipCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadows.soft
  },
  tipCardIconBubble: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  tipCardIconSparkle: {
    fontSize: 18
  },
  tipCardTextBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  tipCardTitle: {
    color: colors.text,
    fontSize: typography.button,
    fontWeight: '800'
  },
  tipCardBody: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '500',
    lineHeight: 18
  },
  tipDetailLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    paddingLeft: 4,
    paddingVertical: 4
  },
  tipDetailLinkText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700'
  },
  tipDetailChevron: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: -1
  },
  actionDock: {
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 2
  },
  bottomActionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between'
  },
  sideActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    maxWidth: 88,
    minHeight: 62,
    paddingVertical: 8,
    ...shadows.soft
  },
  sideActionLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700'
  },
  saveFab: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
    marginHorizontal: 2,
    width: 58,
    ...shadows.button
  },
  saveFabLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2
  },
  saveButtonDisabled: {
    opacity: 0.45
  },
  anotherDirectionRow: {
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 2
  },
  anotherDirectionText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '600'
  },
  analysisRoot: {
    backgroundColor: colors.background,
    flex: 1
  },
  analysisScroll: {
    flex: 1
  },
  analysisScrollContent: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 8
  },
  analysisFooter: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  generateEditButton: {
    alignSelf: 'stretch'
  },
  section: {
    gap: 10,
    marginTop: 18
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800'
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  suggestionCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    ...shadows.soft
  },
  suggestionCardSelected: {
    backgroundColor: 'rgba(47, 107, 255, 0.08)',
    borderColor: colors.primary
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  suggestionHeaderRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  savedBadge: {
    backgroundColor: 'rgba(47, 211, 155, 0.18)',
    borderRadius: radius.sm,
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  suggestionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 8
  },
  textSelected: {
    color: colors.primary
  },
  checkmark: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold'
  },
  suggestionConcept: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4
  },
  suggestionMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4
  },
  suggestionMetaLabel: {
    color: colors.text,
    fontWeight: '700'
  },
  changesList: {
    gap: 4
  },
  changeItem: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  pressed: {
    opacity: 0.72
  }
});
