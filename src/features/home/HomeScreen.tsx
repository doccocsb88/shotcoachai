import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { Screen } from '../../components/common/Screen';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { PickedPhoto } from '../../models/analysis';
import { UserAccessState, UserManager } from '../../services/user/UserManager';

const galleryIcon = require('../../../assets/icons/image-gallery.png');
const historyIcon = require('../../../assets/icons/history.png');

interface Props {
  onOpenPreview: () => void;
  onOpenPoseAssist: () => void;
  onOpenMenu: () => void;
  onOpenHistory: () => void;
  onOpenPaywall: () => void;
  referenceImageUri?: string | null;
}

const navBarTopPadding = Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight ?? 0) + spacing.sm;
const dockBottomPadding = Platform.OS === 'ios' ? 32 : spacing.sm;
const cameraFallbackBackground = '#05070B';

export function HomeScreen({
  onOpenPreview,
  onOpenPoseAssist,
  onOpenMenu,
  onOpenHistory,
  onOpenPaywall,
  referenceImageUri
}: Props) {
  const cameraRef = useRef<CameraView>(null);
  const { width } = useWindowDimensions();
  const setCurrentPhoto = useAnalysisStore(state => state.setCurrentPhoto);
  const cameraMode = useAnalysisStore(state => state.cameraMode);
  const setPoseAiSelectedTemplateId = useAnalysisStore(state => state.setPoseAiSelectedTemplateId);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [accessState, setAccessState] = useState<UserAccessState>(UserManager.getState());
  const referenceWidth = Math.round((width * 2) / 5);

  useEffect(() => {
    const unsubscribe = UserManager.subscribe(setAccessState);
    void UserManager.refresh();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      void requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  const choosePhoto = async () => {
    await UserManager.ensureReady();
    if (!UserManager.canStartCapture()) {
      showCaptureLimitPaywall();
      return;
    }

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

    await handlePickerResult(result);
  };

  const takePhoto = async () => {
    if (isCapturing) return;
    await UserManager.ensureReady();
    if (!UserManager.canStartCapture()) {
      showCaptureLimitPaywall();
      return;
    }

    const permission = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
      return;
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
      if (!photo) return;
      await handleCapturedPhoto(photo);
    } catch {
      Alert.alert('Capture failed', 'Please try taking the photo again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const showCaptureLimitPaywall = () => {
    Alert.alert(
      'Unlock unlimited captures',
      'Free users can capture up to 3 photos. Upgrade to ShotCoach Pro for unlimited shooting.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Upgrade', onPress: onOpenPaywall }
      ]
    );
  };

  const handlePickerResult = async (result: ImagePicker.ImagePickerResult) => {
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

    await UserManager.trackCaptureStarted();
    setCurrentPhoto(picked);
    if (cameraMode === 'pose_ai') {
      setPoseAiSelectedTemplateId(undefined);
      onOpenPoseAssist();
    } else {
      onOpenPreview();
    }
  };

  const handleCapturedPhoto = async (asset: { uri: string; width: number; height: number }) => {
    if (asset.width < 512 || asset.height < 512) {
      Alert.alert('Image too small', 'Please choose a photo at least 512px wide and tall.');
      return;
    }

    const picked: PickedPhoto = {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      mimeType: 'image/jpeg'
    };

    await UserManager.trackCaptureStarted();
    setCurrentPhoto(picked);
    if (cameraMode === 'pose_ai') {
      setPoseAiSelectedTemplateId(undefined);
      onOpenPoseAssist();
    } else {
      onOpenPreview();
    }
  };

  const renderCameraPreview = () => {
    if (!cameraPermission) {
      return (
        <View style={styles.cameraFallback}>
          <Text style={styles.cameraFallbackText}>Preparing camera</Text>
        </View>
      );
    }

    if (!cameraPermission.granted) {
      return (
        <Pressable
          accessibilityLabel="Allow camera access"
          accessibilityRole="button"
          onPress={requestCameraPermission}
          style={styles.cameraFallback}
        >
          <Text style={styles.cameraFallbackText}>Tap to allow camera</Text>
        </Pressable>
      );
    }

    return <CameraView ref={cameraRef} facing="back" style={styles.cameraView} />;
  };

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <View style={styles.previewLayer}>
          {renderCameraPreview()}
          <View style={styles.focusMarkTopLeft} />
          <View style={styles.focusMarkTopRight} />
          <View style={styles.focusMarkBottomLeft} />
          <View style={styles.focusMarkBottomRight} />
          <Text style={styles.cameraHint}>Frame the full shooting pose</Text>
          {!accessState.isPremium ? (
            <Text style={styles.freeQuotaPill}>
              {UserManager.remainingFreeCaptures()} free capture{UserManager.remainingFreeCaptures() === 1 ? '' : 's'} left
            </Text>
          ) : null}
          {referenceImageUri ? (
            <View style={[styles.referencePreview, { width: referenceWidth }]}>
              <Image source={{ uri: referenceImageUri }} style={styles.referencePreviewImage} resizeMode="cover" />
              <View style={styles.referencePreviewLabel}>
                <Text style={styles.referencePreviewLabelText}>Reference</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={[styles.navBar, { paddingTop: navBarTopPadding }]}>
          <Pressable
            accessibilityLabel="Open menu"
            accessibilityRole="button"
            onPress={onOpenMenu}
            style={({ pressed }) => [styles.navIconButton, pressed && styles.pressed]}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle} numberOfLines={1}>
              ShotCoach AI
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Open history"
            accessibilityRole="button"
            onPress={onOpenHistory}
            style={({ pressed }) => [styles.navIconButton, pressed && styles.pressed]}
          >
            <Image source={historyIcon} style={styles.navButtonIcon} />
          </Pressable>
        </View>

        <View style={[styles.bottomDock, { paddingBottom: dockBottomPadding }]}>
          <Pressable
            accessibilityLabel="Open photo library"
            accessibilityRole="button"
            onPress={choosePhoto}
            style={({ pressed }) => [styles.galleryThumbWrap, pressed && styles.pressed]}
          >
            <Image source={galleryIcon} style={styles.galleryIcon} />
          </Pressable>

          <Pressable
            accessibilityLabel="Capture photo"
            accessibilityRole="button"
            onPress={takePhoto}
            disabled={isCapturing}
            style={({ pressed }) => [styles.captureButton, (pressed || isCapturing) && styles.pressed]}
          >
            <View style={styles.captureInner} />
          </Pressable>

          <View style={styles.bottomDockSpacer} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  },
  previewLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: cameraFallbackBackground,
    justifyContent: 'center',
    zIndex: 0
  },
  cameraView: {
    ...StyleSheet.absoluteFillObject
  },
  cameraFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: cameraFallbackBackground,
    justifyContent: 'center'
  },
  cameraFallbackText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800'
  },
  navBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(247, 250, 255, 0.94)',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2
  },
  navIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...shadows.soft
  },
  menuIcon: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: -1
  },
  navTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center'
  },
  navCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.sm
  },
  navButtonIcon: {
    height: 24,
    tintColor: colors.text,
    width: 24
  },
  cameraHint: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    bottom: 108,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    ...shadows.soft
  },
  freeQuotaPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(8, 18, 34, 0.72)',
    borderRadius: radius.pill,
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    top: navBarTopPadding + 72
  },
  referencePreview: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.surface,
    borderColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'absolute',
    right: 18,
    top: navBarTopPadding + 76,
    ...shadows.card
  },
  referencePreviewImage: {
    height: '100%',
    width: '100%'
  },
  referencePreviewLabel: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: radius.pill,
    left: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: 'absolute',
    top: 8
  },
  referencePreviewLabelText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800'
  },
  focusMarkTopLeft: {
    borderColor: colors.primary,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    height: 52,
    left: 20,
    position: 'absolute',
    top: 100,
    width: 52
  },
  focusMarkTopRight: {
    borderColor: colors.primary,
    borderRightWidth: 3,
    borderTopWidth: 3,
    height: 52,
    position: 'absolute',
    right: 20,
    top: 100,
    width: 52
  },
  focusMarkBottomLeft: {
    borderBottomWidth: 3,
    borderColor: colors.primary,
    borderLeftWidth: 3,
    bottom: 120,
    height: 52,
    left: 20,
    position: 'absolute',
    width: 52
  },
  focusMarkBottomRight: {
    borderBottomWidth: 3,
    borderColor: colors.primary,
    borderRightWidth: 3,
    bottom: 120,
    height: 52,
    position: 'absolute',
    right: 20,
    width: 52
  },
  bottomDock: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
    zIndex: 2
  },
  galleryThumbWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
    ...shadows.soft
  },
  galleryIcon: {
    height: 28,
    tintColor: colors.text,
    width: 28
  },
  bottomDockSpacer: {
    height: 58,
    width: 58
  },
  captureButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: 40,
    borderWidth: 4,
    height: 78,
    justifyContent: 'center',
    width: 78,
    ...shadows.button
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
