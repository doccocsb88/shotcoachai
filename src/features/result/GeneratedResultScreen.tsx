import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { BeforeAfterSlider } from '../../components/beforeAfter/BeforeAfterSlider';
import { ForegroundToast } from '../../components/common/ForegroundToast';
import {
  CameraOutlineIcon,
  ChevronLeftIcon,
  DownloadOutlineIcon,
  MoreHorizontalIcon,
  ShareOutlineIcon
} from '../../components/icons/ResultActionIcons';
import { Screen } from '../../components/common/Screen';
import { colors, radius, shadows, typography } from '../../constants/theme';
import {
  AnalysisResult,
  createGeneratedHistoryResult,
  getStoredGenerationUri,
  ImageQualityEvaluation,
  mergeSuggestionGeneration
} from '../../models/analysis';
import { PHOTO_AI_TOOLS, PhotoAiToolId } from '../../models/photoAiTool';
import { evaluateEditedImageQuality, generateEditedImage } from '../../services/openai/generateImage';
import { saveImageToLibrary, shareImage } from '../../services/share/shareGuide';
import { useAnalysisStore } from '../../core/store/analysisStore';

const IMAGE_GENERATION_TIMEOUT_MS = 90_000;
const QUALITY_EVALUATION_TIMEOUT_MS = 20_000;
const GENERATE_EDIT_ERROR_MESSAGE = 'We could not create your AI edit right now. Please check your connection and try again.';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

function buildIdentityLightingRetryPrompt(prompt: string, evaluation?: ImageQualityEvaluation): string {
  const reason = evaluation?.retry_reason?.trim();
  return `
${prompt}

Retry correction:
The previous generation did not preserve identity, lighting, or realism strongly enough${reason ? `: ${reason}` : '.'}

Rewrite the edit with MUCH STRONGER constraints:
- Preserve exact face shape, eye shape, nose shape, jawline, age appearance, skin tone identity, hairstyle, clothing, body shape, and accessories.
- Preserve the same location, background, lighting condition, time of day, weather, white balance, color temperature, and scene mood.
- Reduce edit strength.
- Remove beauty, influencer, cinematic, dramatic, fantasy, golden hour, and heavy color grading changes.
- Improve only pose, framing, crop, camera angle feel, and natural subject separation.
`.trim();
}

function getDirectToolId(analysisId: string): PhotoAiToolId | undefined {
  if (!analysisId.startsWith('direct:')) return undefined;
  const toolId = analysisId.split(':')[1] as PhotoAiToolId | undefined;
  return PHOTO_AI_TOOLS.some(tool => tool.id === toolId) ? toolId : undefined;
}

interface Props {
  result: AnalysisResult;
  suggestionIndex: number;
  onBack: () => void;
  onBackToAnalysis: () => void;
  onRetake: (referenceUri: string) => void;
  openedFromHistory?: boolean;
  canReturnToAnalysis?: boolean;
}

export function GeneratedResultScreen({
  result,
  suggestionIndex,
  onBack,
  onBackToAnalysis,
  onRetake,
  openedFromHistory = false,
  canReturnToAnalysis = true
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUri, setGeneratedImageUri] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retrySuggestionIndex, setRetrySuggestionIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);
  const addRecentResult = useAnalysisStore(state => state.addRecentResult);
  const isDirectToolResult = result.analysisId.startsWith('direct:');
  const directToolId = getDirectToolId(result.analysisId);

  useEffect(() => {
    setGenerationError(null);
    setRetrySuggestionIndex(null);
    const stored = getStoredGenerationUri(result, suggestionIndex);
    if (stored) {
      setGeneratedImageUri(stored);
      setIsGenerating(false);
      return;
    }
    void generateSuggestion(suggestionIndex);
  }, [result.analysisId, suggestionIndex]);

  const generateSuggestion = async (suggestionIndex: number) => {
    const selected = result.suggestions[suggestionIndex];
    if (!selected) return;
    const stored = getStoredGenerationUri(result, suggestionIndex);
    setGenerationError(null);
    setRetrySuggestionIndex(null);
    if (stored) {
      setGeneratedImageUri(stored);
      return;
    }

    try {
      setGeneratedImageUri(null);
      setIsGenerating(true);
      let uri = await withTimeout(
        generateEditedImage(
          selected.image_prompt,
          result.originalImageUri,
          result.originalImageMimeType,
          directToolId
        ),
        IMAGE_GENERATION_TIMEOUT_MS,
        'The AI edit is taking too long. Please check your connection and try again.'
      );
      let qualityEvaluation: ImageQualityEvaluation | undefined;
      if (!isDirectToolResult) {
        try {
          qualityEvaluation = await withTimeout(
            evaluateEditedImageQuality({
              originalImageUri: result.originalImageUri,
              generatedImageUri: uri,
              originalImageMimeType: result.originalImageMimeType,
              selectedDirection: {
                suggestion: selected,
                recipe: result.generationRecipes?.[suggestionIndex]
              }
            }),
            QUALITY_EVALUATION_TIMEOUT_MS,
            'Quality evaluation timed out.'
          );
        } catch {
          qualityEvaluation = undefined;
        }
      }

      if (!isDirectToolResult && qualityEvaluation?.retry_required) {
        const retryPrompt = buildIdentityLightingRetryPrompt(selected.image_prompt, qualityEvaluation);
        uri = await withTimeout(
          generateEditedImage(
            retryPrompt,
            result.originalImageUri,
            result.originalImageMimeType
          ),
          IMAGE_GENERATION_TIMEOUT_MS,
          'The AI edit is taking too long. Please check your connection and try again.'
        );

        try {
          qualityEvaluation = await withTimeout(
            evaluateEditedImageQuality({
              originalImageUri: result.originalImageUri,
              generatedImageUri: uri,
              originalImageMimeType: result.originalImageMimeType,
              selectedDirection: {
                suggestion: selected,
                recipe: result.generationRecipes?.[suggestionIndex],
                retry: 'identity_lighting_reference_mode'
              }
            }),
            QUALITY_EVALUATION_TIMEOUT_MS,
            'Quality evaluation timed out.'
          );
        } catch {
          qualityEvaluation = undefined;
        }
      }

      setGeneratedImageUri(uri);

      const updatedResult = mergeSuggestionGeneration(result, suggestionIndex, uri, qualityEvaluation);
      const historyResult = createGeneratedHistoryResult(updatedResult, suggestionIndex, uri, qualityEvaluation);
      setCurrentResult(updatedResult);
      await addRecentResult(historyResult);
    } catch (error) {
      setGeneratedImageUri(null);
      setGenerationError(GENERATE_EDIT_ERROR_MESSAGE);
      setRetrySuggestionIndex(suggestionIndex);
      Alert.alert('AI Edit failed', GENERATE_EDIT_ERROR_MESSAGE, [
        { text: 'Close', style: 'cancel' },
        { text: 'Retry', onPress: () => void generateSuggestion(suggestionIndex) }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleRetake = () => {
    if (generatedImageUri) {
      onRetake(generatedImageUri);
      return;
    }
    onBack();
  };

  const selectedSuggestion = result.suggestions[suggestionIndex];

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
    if (openedFromHistory || !canReturnToAnalysis) {
      onBack();
      return;
    }
    onBackToAnalysis();
  };

  const tipDetailBody = useMemo(() => {
    if (!selectedSuggestion) return tipCardDescription;
    const parts = [selectedSuggestion.concept, ...(selectedSuggestion.changes ?? [])].filter(Boolean);
    return parts.length ? parts.join('\n\n') : tipCardDescription;
  }, [selectedSuggestion, tipCardDescription]);

  const openTipDetail = () => {
    Alert.alert(selectedSuggestion?.title ?? tipCardTitle, tipDetailBody);
  };

  const retryGeneration = () => {
    if (retrySuggestionIndex === null || isGenerating) {
      return;
    }
    void generateSuggestion(retrySuggestionIndex);
  };

  const closeGenerationError = () => {
    setGenerationError(null);
    setRetrySuggestionIndex(null);
    if (!canReturnToAnalysis) {
      onBack();
      return;
    }
    onBackToAnalysis();
  };

  return (
    <Screen scroll={false}>
      <View style={styles.resultChromeRoot}>
          <View style={styles.resultHeader}>
            <Pressable
              accessibilityLabel={openedFromHistory || !canReturnToAnalysis ? 'Back' : 'Back to creative directions'}
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
              accessibilityLabel="Show tip detail"
              accessibilityRole="button"
              disabled={headerActionsDisabled}
              onPress={openTipDetail}
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
                {generationError ? (
                  <View style={styles.generationErrorOverlay}>
                    <View style={styles.generationErrorCard}>
                      <Text style={styles.generationErrorTitle}>AI edit failed</Text>
                      <Text style={styles.generationErrorBody}>{generationError}</Text>
                      <View style={styles.generationErrorActions}>
                        <Pressable
                          accessibilityLabel="Close AI edit error"
                          accessibilityRole="button"
                          disabled={isGenerating}
                          onPress={closeGenerationError}
                          style={({ pressed }) => [
                            styles.closeErrorButton,
                            isGenerating && styles.retryButtonDisabled,
                            pressed && !isGenerating && styles.pressed
                          ]}
                        >
                          <Text style={styles.closeErrorButtonText}>Close</Text>
                        </Pressable>
                        <Pressable
                          accessibilityLabel="Retry AI edit"
                          accessibilityRole="button"
                          disabled={isGenerating || retrySuggestionIndex === null}
                          onPress={retryGeneration}
                          style={({ pressed }) => [
                            styles.retryButton,
                            (isGenerating || retrySuggestionIndex === null) && styles.retryButtonDisabled,
                            pressed && !isGenerating && styles.pressed
                          ]}
                        >
                          {isGenerating ? (
                            <ActivityIndicator color={colors.white} size="small" />
                          ) : (
                            <Text style={styles.retryButtonText}>Retry</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.actionDock}>
            <View style={styles.bottomActionsRow}>
              <Pressable
                accessibilityLabel="Retake — return home"
                accessibilityRole="button"
                disabled={headerActionsDisabled}
                onPress={handleRetake}
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

            {openedFromHistory || isDirectToolResult ? null : (
              <Pressable
                accessibilityLabel="Choose another creative direction"
                accessibilityRole="button"
                disabled={busy || isGenerating}
                onPress={returnToSuggestionPicker}
                style={({ pressed }) => [styles.anotherDirectionRow, pressed && styles.pressed]}
              >
                <Text style={styles.anotherDirectionText}>↔ Another direction</Text>
              </Pressable>
            )}
          </View>
          {isGenerating ? (
            <View pointerEvents="none" style={styles.generatingToastOverlay}>
              <ForegroundToast />
            </View>
          ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultChromeRoot: {
    backgroundColor: colors.background,
    flex: 1,
    paddingTop: Platform.select({ android: StatusBar.currentHeight ?? 0, ios: 0 })
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
  generationErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 34, 0.18)',
    justifyContent: 'center',
    padding: 22
  },
  generationErrorCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 18,
    width: '100%',
    ...shadows.button
  },
  generationErrorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center'
  },
  generationErrorBody: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center'
  },
  generationErrorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  closeErrorButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18
  },
  closeErrorButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900'
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18
  },
  retryButtonDisabled: {
    opacity: 0.5
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900'
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
  generatingToastOverlay: {
    bottom: 88,
    left: 16,
    position: 'absolute',
    right: 16
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
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 8
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
  suggestionCardLocked: {
    opacity: 0.68
  },
  suggestionCardDisabled: {
    opacity: 0.58
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
  premiumBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30
  },
  premiumBadgeIcon: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900'
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
