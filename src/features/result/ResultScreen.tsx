import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, Pressable, ScrollView, Image } from 'react-native';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors } from '../../constants/theme';
import {
  AnalysisResult,
  getStoredGenerationUri,
  mergeSuggestionGeneration
} from '../../models/analysis';
import { generateEditedImage } from '../../services/openai/generateImage';
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

      const updatedResult = mergeSuggestionGeneration(result, selectedSuggestionIndex, uri);
      setCurrentResult(updatedResult);
      setGeneratedImageUri(uri);
      await addRecentResult(updatedResult);
    } catch (error) {
      Alert.alert('Generation failed', error instanceof Error ? error.message : 'Could not generate the edited image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedImageUri) return;
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
    if (!generatedImageUri) return;
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

  if (generatedImageUri) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>Result</Text>
          <PrimaryButton title="Done" onPress={onBack} variant="ghost" />
        </View>

        <View style={styles.beforeAfterContainer}>
          <Text style={styles.sectionTitle}>Before & After</Text>
          <View style={styles.previewRow}>
            <View style={styles.previewCell}>
              <Image source={{ uri: result.originalImageUri }} style={styles.previewImage} resizeMode="cover" />
              <Text style={styles.previewLabel}>Original</Text>
            </View>
            <View style={styles.previewCell}>
              <Image source={{ uri: generatedImageUri }} style={styles.previewImage} resizeMode="cover" />
              <Text style={styles.previewLabel}>AI Edit</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton title={busy ? 'Working...' : 'Save Image'} onPress={handleSave} disabled={busy} />
          <PrimaryButton title="Share Image" onPress={handleShare} disabled={busy} variant="secondary" />
          <PrimaryButton
            title="Try Another Suggestion"
            onPress={() => {
              setGeneratedImageUri(null);
              setSelectedSuggestionIndex(null);
            }}
            disabled={busy}
            variant="ghost"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis Result</Text>
        <PrimaryButton title="Done" onPress={onBack} variant="ghost" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assessment</Text>
        <Text style={styles.body}>{result.overallAssessment}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose a Creative Direction</Text>
        <ScrollView style={styles.suggestionsContainer}>
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
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title={isGenerating ? 'Generating...' : 'Generate Edit'}
          onPress={handleGenerate}
          disabled={selectedSuggestionIndex === null || isGenerating || hasStoredForSelection}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  },
  section: {
    gap: 10,
    marginTop: 22
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
  suggestionsContainer: {
    marginTop: 8,
    maxHeight: 500
  },
  suggestionCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12
  },
  suggestionCardSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(56, 189, 248, 0.1)'
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
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 6,
    color: '#4ade80',
    fontSize: 11,
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
    color: colors.accent
  },
  checkmark: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: 'bold'
  },
  suggestionConcept: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 6
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
  actions: {
    gap: 12,
    marginTop: 26,
    marginBottom: 26
  },
  beforeAfterContainer: {
    marginTop: 24,
    gap: 12
  },
  previewRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between'
  },
  previewCell: {
    flex: 1,
    alignItems: 'center',
    gap: 8
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    backgroundColor: colors.surface
  },
  previewLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700'
  }
});
