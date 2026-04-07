import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { GuideImage } from '../../components/overlay/GuideImage';
import { ScoreCard } from '../../components/score/ScoreCard';
import { SubscoreList } from '../../components/score/SubscoreList';
import { colors } from '../../constants/theme';
import { AnalysisResult } from '../../models/analysis';
import { saveImageToLibrary, shareImage } from '../../services/share/shareGuide';

interface Props {
  result: AnalysisResult;
  onBack: () => void;
}

export function ResultScreen({ result, onBack }: Props) {
  const { width } = useWindowDimensions();
  const [showGuide, setShowGuide] = useState(Boolean(result.overlayData));
  const [busy, setBusy] = useState(false);
  const guideRef = useRef<View>(null);
  const imageWidth = width - 40;
  const imageHeight = Math.round(imageWidth * 1.25);

  const captureGuide = async () => {
    if (!guideRef.current) {
      throw new Error('Guide view is not ready.');
    }
    return captureRef(guideRef, {
      format: 'jpg',
      quality: 0.95,
      result: 'tmpfile'
    });
  };

  const handleSave = async () => {
    try {
      setBusy(true);
      const uri = await captureGuide();
      await saveImageToLibrary(uri);
      Alert.alert('Saved', 'AI Guide image saved to your library.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Could not save this image.');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    try {
      setBusy(true);
      const uri = await captureGuide();
      await shareImage(uri);
    } catch (error) {
      Alert.alert('Share failed', error instanceof Error ? error.message : 'Could not share this image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Analysis</Text>
        <PrimaryButton title="Done" onPress={onBack} variant="ghost" />
      </View>

      <View style={styles.toggle}>
        <PrimaryButton
          title="Original"
          onPress={() => setShowGuide(false)}
          variant={showGuide ? 'secondary' : 'primary'}
          style={styles.toggleButton}
        />
        <PrimaryButton
          title="AI Guide"
          onPress={() => setShowGuide(true)}
          variant={showGuide ? 'primary' : 'secondary'}
          disabled={!result.overlayData}
          style={styles.toggleButton}
        />
      </View>

      <View ref={guideRef} collapsable={false} style={styles.captureFrame}>
        <GuideImage
          imageUri={result.originalImageUri}
          showOverlay={showGuide}
          overlayData={result.overlayData}
          width={imageWidth}
          height={imageHeight}
        />
      </View>

      <View style={styles.section}>
        <ScoreCard score={result.overallScore} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sub-scores</Text>
        <SubscoreList subscores={result.subscores} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.body}>{result.summary}</Text>
      </View>

      <ResultList title="Strengths" items={result.strengths} />
      <ResultList title="Issues" items={result.issues} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggestions</Text>
        {result.suggestions.map((suggestion, index) => (
          <View key={`${suggestion.title}-${index}`} style={styles.suggestion}>
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
            <Text style={styles.body}>{suggestion.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <PrimaryButton title={busy ? 'Working...' : 'Save AI Guide'} onPress={handleSave} disabled={busy || !result.overlayData} />
        <PrimaryButton title="Share AI Guide" onPress={handleShare} disabled={busy || !result.overlayData} variant="secondary" />
      </View>
    </Screen>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <Text key={`${title}-${index}`} style={styles.bullet}>• {item}</Text>
      ))}
    </View>
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
  toggle: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20
  },
  toggleButton: {
    flex: 1
  },
  captureFrame: {
    alignItems: 'center',
    backgroundColor: colors.background,
    marginTop: 18
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
  bullet: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23
  },
  suggestion: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14
  },
  suggestionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  actions: {
    gap: 12,
    marginTop: 26
  }
});
