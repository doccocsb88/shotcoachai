import * as ImagePicker from 'expo-image-picker';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors } from '../../constants/theme';
import { PickedPhoto } from '../../models/analysis';
import { formatScore } from '../../utils/score';

interface Props {
  onOpenPreview: () => void;
  onOpenHistory: () => void;
}

export function HomeScreen({ onOpenPreview, onOpenHistory }: Props) {
  const setCurrentPhoto = useAnalysisStore(state => state.setCurrentPhoto);
  const recentResults = useAnalysisStore(state => state.recentResults);

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to choose an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1
    });

    handlePickerResult(result);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1
    });

    handlePickerResult(result);
  };

  const handlePickerResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    if (asset.width < 512 || asset.height < 512) {
      Alert.alert('Image too small', 'Please choose a photo at least 512px wide and tall.');
      return;
    }

    const picked: PickedPhoto = {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName ?? undefined,
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileSize: asset.fileSize
    };

    setCurrentPhoto(picked);
    onOpenPreview();
  };

  const latest = recentResults[0];

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>AI Photo Coach</Text>
        <Text style={styles.title}>Know what to fix before you post.</Text>
        <Text style={styles.subtitle}>
          Pick one photo, get a score, short coaching notes, and a visual guide drawn on top of the original shot.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Take Photo" onPress={takePhoto} />
        <PrimaryButton title="Choose Photo" onPress={choosePhoto} variant="secondary" />
      </View>

      {latest ? (
        <View style={styles.historyCard}>
          <View>
            <Text style={styles.historyLabel}>Recent result</Text>
            <Text style={styles.historyTitle}>{formatScore(latest.overallScore)} · {latest.summary}</Text>
          </View>
          <PrimaryButton title="Open History" onPress={onOpenHistory} variant="ghost" />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 12,
    paddingTop: 32
  },
  kicker: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800'
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24
  },
  actions: {
    gap: 12,
    marginTop: 32
  },
  historyCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    marginTop: 32,
    padding: 16
  },
  historyLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6
  },
  historyTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21
  }
});
