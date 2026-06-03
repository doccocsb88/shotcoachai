import { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows, typography } from '../../constants/theme';
import { getAiProcessingConsent, setAiProcessingConsent } from '../../services/storage/aiProcessingConsentStorage';

interface Props {
  onBack: () => void;
  onAnalyze: () => void;
}

export function PhotoPreviewScreen({ onBack, onAnalyze }: Props) {
  const photo = useAnalysisStore(state => state.currentPhoto);
  const { width } = useWindowDimensions();
  const imageWidth = width - 40;
  const [hasAiProcessingConsent, setHasAiProcessingConsent] = useState<boolean | null>(null);
  const [isConsentVisible, setConsentVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getAiProcessingConsent()
      .then(value => {
        if (isMounted) {
          setHasAiProcessingConsent(value);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasAiProcessingConsent(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAnalyzePress = async () => {
    const consentValue = hasAiProcessingConsent ?? await getAiProcessingConsent();
    setHasAiProcessingConsent(consentValue);

    if (consentValue) {
      onAnalyze();
      return;
    }

    setConsentVisible(true);
  };

  const handleConsentContinue = async () => {
    await setAiProcessingConsent();
    setHasAiProcessingConsent(true);
    setConsentVisible(false);
    onAnalyze();
  };

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
        <View style={styles.previewBody}>
          <Text style={styles.subtitle}>Confirm the photo before sending it to AI analysis.</Text>
          <View style={[styles.imageFrame, { width: imageWidth }]}>
            <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
          </View>
        </View>
        <View style={styles.actions}>
          <PrimaryButton title="Analyze with AI" onPress={handleAnalyzePress} />
          <PrimaryButton title="Choose Another Photo" onPress={onBack} variant="secondary" />
        </View>
        <AiProcessingConsentModal
          visible={isConsentVisible}
          onCancel={() => setConsentVisible(false)}
          onContinue={handleConsentContinue}
        />
      </View>
    </Screen>
  );
}

function AiProcessingConsentModal({
  visible,
  onCancel,
  onContinue
}: {
  visible: boolean;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Cancel AI processing consent"
          accessibilityRole="button"
          onPress={onCancel}
          style={styles.modalBackdrop}
        />
        <View style={styles.consentCard}>
          <Text style={styles.consentTitle}>AI Processing Notice</Text>
          <Text style={styles.consentBody}>
            To provide AI-powered photo analysis and preview generation, selected photos will be securely sent to OpenAI for processing.
          </Text>

          <View style={styles.consentSection}>
            <Text style={styles.consentSectionTitle}>Data shared:</Text>
            <ConsentBullet text="Selected photos" />
            <ConsentBullet text="Photography instructions" />
          </View>

          <View style={styles.consentSection}>
            <Text style={styles.consentSectionTitle}>Purpose:</Text>
            <ConsentBullet text="Photo analysis" />
            <ConsentBullet text="Pose recommendations" />
            <ConsentBullet text="AI-generated previews" />
          </View>

          <Text style={styles.consentBody}>By continuing, you consent to this processing.</Text>

          <View style={styles.consentActions}>
            <PrimaryButton title="Continue" onPress={onContinue} />
            <PrimaryButton title="Cancel" onPress={onCancel} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConsentBullet({ text }: { text: string }) {
  return (
    <View style={styles.consentBulletRow}>
      <Text style={styles.consentBullet}>•</Text>
      <Text style={styles.consentBulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  previewRoot: {
    flex: 1,
    paddingTop: Platform.select({ android: StatusBar.currentHeight ?? 0, ios: 0 })
  },
  previewBody: {
    flex: 1,
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
    flex: 1,
    overflow: 'hidden',
    ...shadows.card
  },
  image: {
    height: '100%',
    width: '100%'
  },
  actions: {
    gap: 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 16
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
  },
  modalRoot: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 27, 52, 0.42)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  consentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxWidth: 420,
    padding: 22,
    width: '100%',
    ...shadows.card
  },
  consentTitle: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '900',
    marginBottom: 12
  },
  consentBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  consentSection: {
    marginTop: 18
  },
  consentSectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8
  },
  consentBulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6
  },
  consentBullet: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 22
  },
  consentBulletText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 15,
    lineHeight: 22
  },
  consentActions: {
    gap: 10,
    marginTop: 22
  }
});
