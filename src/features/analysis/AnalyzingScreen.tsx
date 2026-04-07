import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors } from '../../constants/theme';
import { useAnalyzePhoto } from './useAnalyzePhoto';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

const statuses = ['Uploading photo', 'Reviewing composition', 'Generating feedback', 'Preparing AI guide'];

export function AnalyzingScreen({ onComplete, onBack }: Props) {
  const photo = useAnalysisStore(state => state.currentPhoto);
  const error = useAnalysisStore(state => state.error);
  const setError = useAnalysisStore(state => state.setError);
  const { analyze } = useAnalyzePhoto();
  const [step, setStep] = useState(0);

  const status = useMemo(() => statuses[Math.min(step, statuses.length - 1)], [step]);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(value => Math.min(value + 1, statuses.length - 1));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

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
  }, [analyze, onComplete, photo]);

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
            <PrimaryButton title="Back to preview" onPress={() => { setError(undefined); onBack(); }} variant="secondary" />
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.title}>Analyzing photo</Text>
            <Text style={styles.subtitle}>{status}</Text>
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
    borderRadius: 8,
    height: 180,
    marginBottom: 28,
    width: 140
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 22,
    textAlign: 'center'
  }
});
