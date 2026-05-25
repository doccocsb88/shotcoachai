import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { ForegroundToast } from '../../components/common/ForegroundToast';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors, radius, typography } from '../../constants/theme';
import { useAnalyzePhoto } from './useAnalyzePhoto';

interface Props {
  onComplete: () => void;
  onBack: () => void;
  onCancel: () => void;
}

/** Cosmetic progress only — advances on a timer. Must match what `analyze()` actually does (see `useAnalyzePhoto` / `analyzePhoto`). */
const statuses = [
  'Preparing your photo',
  'Running vision analysis',
  'Scoring composition, lighting, and pose',
  'Creating creative directions',
  'Composing image prompts',
  'Saving analysis'
];

export function AnalyzingScreen({ onComplete, onBack, onCancel }: Props) {
  const photo = useAnalysisStore(state => state.currentPhoto);
  const error = useAnalysisStore(state => state.error);
  const setError = useAnalysisStore(state => state.setError);
  const { analyze } = useAnalyzePhoto();
  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState(0);

  const status = useMemo(() => statuses[Math.min(step, statuses.length - 1)], [step]);

  useEffect(() => {
    if (error) return undefined;

    const timer = setInterval(() => {
      setStep(value => Math.min(value + 1, statuses.length - 1));
    }, 1200);
    return () => clearInterval(timer);
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
        <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
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
            <Text style={styles.title}>Analyzing photo</Text>
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
    height: 180,
    marginBottom: 28,
    width: 140
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
