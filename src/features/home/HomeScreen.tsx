import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors } from '../../constants/theme';
import { PickedPhoto } from '../../models/analysis';

interface Props {
  onOpenPreview: () => void;
  onOpenMenu: () => void;
}

export function HomeScreen({ onOpenPreview, onOpenMenu }: Props) {
  const setCurrentPhoto = useAnalysisStore(state => state.setCurrentPhoto);

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

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.nav}>
          <Pressable
            accessibilityLabel="Open menu"
            accessibilityRole="button"
            onPress={onOpenMenu}
            style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
          <Text style={styles.navTitle}>ShotCoach AI</Text>
          <View style={styles.navSpacer} />
        </View>

        <View style={styles.cameraStage}>
          <View style={styles.focusMarkTopLeft} />
          <View style={styles.focusMarkTopRight} />
          <View style={styles.focusMarkBottomLeft} />
          <View style={styles.focusMarkBottomRight} />
          <View style={styles.playerSilhouette}>
            <View style={styles.head} />
            <View style={styles.bodyLine} />
            <View style={styles.armLine} />
            <View style={styles.legLine} />
          </View>
          <Text style={styles.cameraHint}>Frame the full shooting pose</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="Gallery" onPress={choosePhoto} variant="secondary" style={styles.sideAction} />
          <Pressable
            accessibilityLabel="Capture photo"
            accessibilityRole="button"
            onPress={takePhoto}
            style={({ pressed }) => [styles.captureButton, pressed && styles.pressed]}
          >
            <View style={styles.captureInner} />
          </Pressable>
          <View style={styles.sideAction} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 24
  },
  nav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  menuIcon: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: -2
  },
  navTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  navSpacer: {
    width: 44
  },
  cameraStage: {
    alignItems: 'center',
    backgroundColor: '#090D13',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginTop: 18,
    overflow: 'hidden'
  },
  cameraHint: {
    bottom: 24,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    position: 'absolute'
  },
  focusMarkTopLeft: {
    borderColor: colors.accent,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    height: 52,
    left: 18,
    position: 'absolute',
    top: 18,
    width: 52
  },
  focusMarkTopRight: {
    borderColor: colors.accent,
    borderRightWidth: 3,
    borderTopWidth: 3,
    height: 52,
    position: 'absolute',
    right: 18,
    top: 18,
    width: 52
  },
  focusMarkBottomLeft: {
    borderBottomWidth: 3,
    borderColor: colors.accent,
    borderLeftWidth: 3,
    bottom: 18,
    height: 52,
    left: 18,
    position: 'absolute',
    width: 52
  },
  focusMarkBottomRight: {
    borderBottomWidth: 3,
    borderColor: colors.accent,
    borderRightWidth: 3,
    bottom: 18,
    height: 52,
    position: 'absolute',
    right: 18,
    width: 52
  },
  playerSilhouette: {
    alignItems: 'center',
    height: 260,
    justifyContent: 'center',
    opacity: 0.58,
    width: 180
  },
  head: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 24,
    height: 48,
    marginBottom: 16,
    width: 48
  },
  bodyLine: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 3,
    height: 98,
    width: 6
  },
  armLine: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 3,
    height: 6,
    position: 'absolute',
    top: 116,
    transform: [{ rotate: '-24deg' }],
    width: 132
  },
  legLine: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 3,
    bottom: 42,
    height: 6,
    position: 'absolute',
    transform: [{ rotate: '18deg' }],
    width: 118
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 18
  },
  captureButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.accent,
    borderRadius: 40,
    borderWidth: 4,
    height: 78,
    justifyContent: 'center',
    width: 78
  },
  sideAction: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 10
  },
  captureInner: {
    backgroundColor: colors.accent,
    borderRadius: 27,
    height: 54,
    width: 54
  },
  pressed: {
    opacity: 0.75
  }
});
