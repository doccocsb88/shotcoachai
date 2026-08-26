import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../../components/common/PrimaryButton';
import { colors, radius, shadows, typography } from '../../../constants/theme';

interface AiProcessingConsentModalProps {
  visible: boolean;
  onCancel: () => void;
  onContinue: () => void;
}

export function AiProcessingConsentModal({
  visible,
  onCancel,
  onContinue
}: AiProcessingConsentModalProps) {
  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999, elevation: 999 }]}>
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
    </View>
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
