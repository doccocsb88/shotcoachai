import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Image, Linking, Platform, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { Screen } from '../../components/common/Screen';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { PickedPhoto } from '../../models/analysis';
import { UserAccessState, UserManager } from '../../services/user/UserManager';
import { CameraIntent } from '../home/HomeScreen';
import { getPhotoAiTool } from '../../models/photoAiTool';
import { getPhotoRecipe } from '../../services/photo-recipes/photoRecipeLibrary';

const galleryIcon = require('../../../assets/icons/image-gallery.png');
const historyIcon = require('../../../assets/icons/history.png');

interface Props {
  onBack: () => void;
  onPhotoSelected: () => void;
  onOpenPaywall: () => void;
  referenceImageUri?: string | null;
  intent?: CameraIntent;
}

const navBarTopPadding = Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + spacing.md;
const dockBottomPadding = Platform.OS === 'ios' ? 32 : spacing.sm;
const cameraFallbackBackground = '#05070B';
const focusTopInset = navBarTopPadding + 88;
const focusBottomInset = dockBottomPadding + 132;

export function CameraScreen({
  onBack,
  onPhotoSelected,
  onOpenPaywall,
  referenceImageUri,
  intent
}: Props) {
  const cameraRef = useRef<CameraView>(null);
  const { width } = useWindowDimensions();
  const setCurrentPhoto = useAnalysisStore(state => state.setCurrentPhoto);
  const cameraMode = useAnalysisStore(state => state.cameraMode);
  const setPoseAiSelectedTemplateId = useAnalysisStore(state => state.setPoseAiSelectedTemplateId);
  const [cameraPermission, requestCameraPermission, getCameraPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [zoom, setZoom] = useState(0);
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

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void getCameraPermission();
      }
    });

    return () => subscription.remove();
  }, [getCameraPermission]);

  const openCameraSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Settings unavailable', 'Please open Settings and allow camera access for ShotCoach AI.');
    }
  };

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
      Alert.alert('Permission needed', 'Please allow camera access in Settings to take a photo.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openCameraSettings }
      ]);
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

  const swapCamera = () => {
    if (isCapturing) return;
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
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
    }
    onPhotoSelected();
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
    }
    onPhotoSelected();
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
        <View style={styles.cameraFallback}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconWrap}>
              <CameraPermissionIcon />
            </View>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionSubtitle}>
              Allow camera access to capture a photo and start your AI pose analysis.
            </Text>
            <Pressable
              accessibilityLabel="Open settings to allow camera access"
              accessibilityRole="button"
              onPress={openCameraSettings}
              style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}
            >
              <Text style={styles.permissionButtonText}>Open Settings</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return <CameraView ref={cameraRef} facing={cameraFacing} style={styles.cameraView} zoom={zoom} />;
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
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.navIconButton, pressed && styles.pressed]}
          >
            <Text style={styles.menuIcon}>←</Text>
          </Pressable>
          <View style={styles.navCenter}>
            <Pressable style={styles.featurePill}>
              <View style={styles.featurePillIcon}>
                <Text style={{color: 'white', fontSize: 12}}>🔲</Text>
              </View>
              <View>
                <Text style={styles.featurePillTitle}>
                  {intent?.type === 'coach' ? 'Composition Coach' : 
                   intent?.type === 'tool' ? (getPhotoAiTool(intent.toolId)?.shortTitle ?? 'Quick Edit') : 
                   intent?.type === 'recipe' ? (getPhotoRecipe(intent.recipeId)?.title ?? 'Recipe') : 'Quick Edit'}
                </Text>
                <Text style={styles.featurePillSubtitle}>
                  {intent?.type === 'coach' ? 'real-time guidance ∨' : 
                   intent?.type === 'tool' ? 'AI Edit Tool ∨' : 
                   intent?.type === 'recipe' ? 'Photo Recipe ∨' : 'AI guidance on ∨'}
                </Text>
              </View>
            </Pressable>
          </View>
          <View style={{flexDirection: 'row', gap: 8}}>
            <Pressable style={styles.navIconButton}>
              <Text style={{color: '#FFF', fontSize: 18}}>⚡</Text>
            </Pressable>
            <Pressable style={styles.navIconButton}>
              <Text style={{color: '#FFF', fontSize: 20, fontWeight: 'bold'}}>⋮</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.zoomContainer}>
          <Pressable onPress={() => setZoom(0)} style={[styles.zoomButton, zoom === 0 && styles.zoomButtonActive]}>
            <Text style={[styles.zoomText, zoom === 0 && styles.zoomTextActive]}>0.5</Text>
          </Pressable>
          <Pressable onPress={() => setZoom(0.05)} style={[styles.zoomButton, zoom === 0.05 && styles.zoomButtonActive]}>
            <Text style={[styles.zoomText, zoom === 0.05 && styles.zoomTextActive]}>1x</Text>
          </Pressable>
          <Pressable onPress={() => setZoom(0.1)} style={[styles.zoomButton, zoom === 0.1 && styles.zoomButtonActive]}>
            <Text style={[styles.zoomText, zoom === 0.1 && styles.zoomTextActive]}>2</Text>
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

          <Pressable
            accessibilityLabel={`Switch to ${cameraFacing === 'back' ? 'front' : 'back'} camera`}
            accessibilityRole="button"
            disabled={isCapturing}
            onPress={swapCamera}
            style={({ pressed }) => [styles.swapCameraButton, (pressed || isCapturing) && styles.pressed]}
          >
            <CameraSwapIcon />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function CameraPermissionIcon() {
  const stroke = colors.primary;

  return (
    <Svg height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M4 8.5h3.2L8.8 6h6.4l1.6 2.5H20a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2Z"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M18 5v4"
        fill="none"
        stroke={colors.danger}
        strokeLinecap="round"
        strokeWidth={2}
      />
      <Path
        d="M18 12h.01"
        fill="none"
        stroke={colors.danger}
        strokeLinecap="round"
        strokeWidth={3}
      />
    </Svg>
  );
}

function CameraSwapIcon() {
  return (
    <Svg height={28} viewBox="0 0 24 24" width={28}>
      <Path
        d="M7.2 7.8A7 7 0 0 1 18.4 9"
        fill="none"
        stroke={colors.white}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
      <Path
        d="M18.4 5.4V9h-3.6"
        fill="none"
        stroke={colors.white}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
      <Path
        d="M16.8 16.2A7 7 0 0 1 5.6 15"
        fill="none"
        stroke={colors.white}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
      <Path
        d="M5.6 18.6V15h3.6"
        fill="none"
        stroke={colors.white}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </Svg>
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
  permissionCard: {
    alignItems: 'center',
    paddingHorizontal: 34,
    width: '100%'
  },
  permissionIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    marginBottom: 18,
    width: 68
  },
  permissionTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center'
  },
  permissionSubtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center'
  },
  permissionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 52,
    paddingHorizontal: 24,
    ...shadows.soft
  },
  permissionButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  navBar: {
    alignItems: 'center',
    backgroundColor: 'transparent',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  navIconButtonPlaceholder: {
    width: 44
  },
  menuIcon: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: -1
  },
  navTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center'
  },
  navCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.sm
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  featurePillIcon: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  featurePillTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700'
  },
  featurePillSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500'
  },
  zoomContainer: {
    position: 'absolute',
    bottom: dockBottomPadding + 100,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
    gap: 4,
    zIndex: 3
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonActive: {
    backgroundColor: '#FFF'
  },
  zoomText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700'
  },
  zoomTextActive: {
    color: '#000'
  },
  navButtonIcon: {
    height: 24,
    tintColor: colors.white,
    width: 24
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
    top: focusTopInset,
    width: 52
  },
  focusMarkTopRight: {
    borderColor: colors.primary,
    borderRightWidth: 3,
    borderTopWidth: 3,
    height: 52,
    position: 'absolute',
    right: 20,
    top: focusTopInset,
    width: 52
  },
  focusMarkBottomLeft: {
    borderBottomWidth: 3,
    borderColor: colors.primary,
    borderLeftWidth: 3,
    bottom: focusBottomInset,
    height: 52,
    left: 20,
    position: 'absolute',
    width: 52
  },
  focusMarkBottomRight: {
    borderBottomWidth: 3,
    borderColor: colors.primary,
    borderRightWidth: 3,
    bottom: focusBottomInset,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
    width: 58
  },
  galleryIcon: {
    height: 28,
    tintColor: colors.white,
    width: 28
  },
  swapCameraButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
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
