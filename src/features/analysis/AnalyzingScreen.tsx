import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { ForegroundToast } from '../../components/common/ForegroundToast';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors, radius, typography } from '../../constants/theme';
import { getPhotoAiTool } from '../../models/photoAiTool';
import { useAnalyzePhoto } from './useAnalyzePhoto';

interface Props {
  onComplete: () => void;
  onBack: () => void;
  onCancel: () => void;
}

/** Cosmetic progress only — advances on a timer. Must match what `analyze()` actually does (see `useAnalyzePhoto` / `analyzePhoto`). */
const statuses = [
  'Preparing your photo',
  'Running photo analysis',
  'Scoring composition, lighting, and pose',
  'Creating coaching directions',
  'Saving analysis'
];

const statusScheduleMs = [0, 2800, 16000, 34000, 56000];

export function AnalyzingScreen({ onComplete, onBack, onCancel }: Props) {
  const photo = useAnalysisStore(state => state.currentPhoto);
  const error = useAnalysisStore(state => state.error);
  const setError = useAnalysisStore(state => state.setError);
  const selectedToolId = useAnalysisStore(state => state.selectedPhotoAiTool);
  const { analyze } = useAnalyzePhoto();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState(0);

  const status = useMemo(() => statuses[Math.min(step, statuses.length - 1)], [step]);
  const selectedTool = getPhotoAiTool(selectedToolId);
  const previewHeight = Math.round(windowHeight * 0.5);
  const previewWidth = Math.min(windowWidth - 48, Math.round(previewHeight * 0.78));

  useEffect(() => {
    if (error) return undefined;

    setStep(0);
    const timers = statusScheduleMs.slice(1).map((delayMs, index) =>
      setTimeout(() => {
        setStep(index + 1);
      }, delayMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [error, attempt]);

  useEffect(() => {
    if (!photo) return;
    let mounted = true;

    analyze(photo.uri, photo.mimeType)
      .then(() => {
        if (mounted) onComplete();
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [analyze, attempt, onComplete, photo]);

  const retry = () => {
    setStep(0);
    setError(undefined);
    setAttempt(value => value + 1);
  };

  if (!photo) {
    return (
      <Screen>
        <Text style={styles.title}>No photo selected</Text>
        <PrimaryButton title="Back" onPress={onBack} variant="secondary" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={[styles.thumbnail, { height: previewHeight, width: previewWidth }]} />
        {error ? (
          <>
            <Text style={styles.title}>Analysis failed</Text>
            <Text style={styles.subtitle}>{error}</Text>
            <View style={styles.errorActions}>
              <PrimaryButton title="Try again" onPress={retry} />
              <PrimaryButton title="Back to preview" onPress={() => { setError(undefined); onBack(); }} variant="secondary" />
              <PrimaryButton title="Go home" onPress={() => { setError(undefined); onCancel(); }} variant="ghost" />
            </View>
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.title}>Running {selectedTool.title}</Text>
            <Text style={styles.subtitle}>{status}</Text>
            <View style={styles.toastDock}>
              <ForegroundToast />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  thumbnail: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 28,
    resizeMode: 'cover'
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 23,
    marginBottom: 22,
    textAlign: 'center'
  },
  errorActions: {
    gap: 12,
    width: '100%'
  },
  toastDock: {
    bottom: 24,
    left: 24,
    position: 'absolute',
    right: 24
  }
});
