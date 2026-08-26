import { CameraView } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraRotate, CaretLeft, Eye, EyeSlash, FlipHorizontal, Lightning, LightningSlash } from 'phosphor-react-native';

import { Screen } from '../../components/common/Screen';
import { colors, radius, spacing } from '../../constants/theme';
import { Pose } from '../../models/pose';
import { useDeviceCamera } from '../camera/useDeviceCamera';
import { OverlayOpacitySlider } from './components/OverlayOpacitySlider';
import { PoseCameraPoseStrip } from './components/PoseCameraPoseStrip';
import { getPosesForCollection } from './poseCollectionCatalog';

interface Props {
  pose: Pose;
  onBack: () => void;
  onCaptured: (photoUri: string) => void;
  onPoseChange?: (pose: Pose) => void;
}

const DEFAULT_OVERLAY_OPACITY = 0.5;
const FLOAT_BOTTOM_PADDING = Platform.OS === 'ios' ? 28 : spacing.md;
const CAMERA_FALLBACK_BACKGROUND = '#05070B';

export function PoseCameraScreen({ pose, onBack, onCaptured, onPoseChange }: Props) {
  const {
    cameraRef,
    cameraPermission,
    isAppActive,
    cameraSessionKey,
    isCapturing,
    cameraFacing,
    flashMode,
    openSettings,
    swapCamera,
    toggleFlash,
    takeStillPhoto,
    handleMountError,
    handleCameraReady,
    logPreviewBranch
  } = useDeviceCamera({ scope: 'pose', poseId: pose.id });

  const [overlayOpacity, setOverlayOpacity] = useState(DEFAULT_OVERLAY_OPACITY);
  const [isOverlayHidden, setIsOverlayHidden] = useState(false);
  const [isOverlayMirrored, setIsOverlayMirrored] = useState(false);

  const collectionPoses = useMemo(() => {
    if (!pose.collectionId) return [pose];
    return getPosesForCollection(pose.collectionId).filter(entry => entry.overlayImage);
  }, [pose.collectionId, pose.id]);

  const showPoseStrip = collectionPoses.length > 1;

  useEffect(() => {
    setIsOverlayMirrored(cameraFacing === 'front');
  }, [cameraFacing]);

  const handleCapture = async () => {
    const still = await takeStillPhoto();
    if (!still) return;
    onCaptured(still.uri);
  };

  const handleSelectPose = (nextPose: Pose) => {
    if (nextPose.id === pose.id) return;
    onPoseChange?.(nextPose);
  };

  const renderPreview = () => {
    if (!cameraPermission) {
      logPreviewBranch('preparing-permission');
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackBody}>Preparing camera…</Text>
        </View>
      );
    }

    if (!cameraPermission.granted) {
      logPreviewBranch('no-permission');
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Camera Permission Required</Text>
          <Text style={styles.fallbackBody}>Allow camera access to match this pose guide.</Text>
          <Pressable onPress={openSettings} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </Pressable>
        </View>
      );
    }

    if (!isAppActive) {
      logPreviewBranch('inactive');
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackBody}>Resuming camera…</Text>
        </View>
      );
    }

    logPreviewBranch('camera-view');

    return (
      <CameraView
        key={cameraSessionKey}
        ref={cameraRef}
        active={isAppActive}
        facing={cameraFacing}
        flash={flashMode}
        style={StyleSheet.absoluteFill}
        mode="picture"
        onCameraReady={handleCameraReady}
        onMountError={handleMountError}
      />
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        {renderPreview()}

        {!isOverlayHidden && pose.overlayImage ? (
          <View pointerEvents="none" style={styles.overlayLayer}>
            <Image
              key={pose.overlayImage.assetKey}
              source={pose.overlayImage.source}
              resizeMode="contain"
              style={[
                styles.overlayImage,
                {
                  opacity: overlayOpacity,
                  transform: [{ scaleX: isOverlayMirrored ? -1 : 1 }]
                }
              ]}
            />
          </View>
        ) : null}

        <LinearGradient
          colors={['transparent', 'rgba(5,7,11,0.35)', 'rgba(5,7,11,0.88)']}
          locations={[0, 0.55, 1]}
          pointerEvents="none"
          style={styles.previewFade}
        />

        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.roundButton} accessibilityLabel="Go back">
            <CaretLeft size={24} color={colors.white} weight="bold" />
          </Pressable>
          <View style={styles.titlePill}>
            <Text style={styles.titlePillText} numberOfLines={1}>
              {pose.title}
            </Text>
          </View>
          <Pressable onPress={toggleFlash} style={styles.roundButton} accessibilityLabel="Toggle flash">
            {flashMode === 'on' ? (
              <Lightning size={20} color={colors.white} weight="fill" />
            ) : (
              <LightningSlash size={20} color={colors.white} weight="bold" />
            )}
          </Pressable>
        </View>

        <View style={[styles.floatingControls, { paddingBottom: FLOAT_BOTTOM_PADDING }]}>
          {showPoseStrip ? (
            <View style={styles.stripPillOuter}>
              <BlurView intensity={48} tint="dark" style={styles.stripPill}>
                <PoseCameraPoseStrip
                  poses={collectionPoses}
                  selectedPoseId={pose.id}
                  onSelectPose={handleSelectPose}
                />
              </BlurView>
            </View>
          ) : null}

          <BlurView intensity={42} tint="dark" style={styles.toolsBar}>
            <OverlayOpacitySlider value={overlayOpacity} onChange={setOverlayOpacity} />
            <Pressable
              onPress={() => setIsOverlayMirrored(current => !current)}
              style={[styles.toolButton, isOverlayMirrored && styles.toolButtonActive]}
              accessibilityLabel="Mirror overlay"
            >
              <FlipHorizontal size={18} color={isOverlayMirrored ? colors.accent : colors.white} weight="bold" />
            </Pressable>
            <Pressable
              onPress={() => setIsOverlayHidden(current => !current)}
              style={[styles.toolButton, isOverlayHidden && styles.toolButtonActive]}
              accessibilityLabel={isOverlayHidden ? 'Show overlay' : 'Hide overlay'}
            >
              {isOverlayHidden ? (
                <EyeSlash size={18} color={colors.accent} weight="bold" />
              ) : (
                <Eye size={18} color={colors.white} weight="bold" />
              )}
            </Pressable>
          </BlurView>

          <View style={styles.shutterRow}>
            <View style={styles.shutterSide} />
            <Pressable
              disabled={isCapturing}
              onPress={() => void handleCapture()}
              style={[styles.shutter, isCapturing && styles.pressed]}
              accessibilityLabel="Capture photo"
            >
              <View style={styles.shutterInner} />
            </Pressable>
            <View style={styles.shutterSide}>
              <Pressable onPress={swapCamera} style={styles.roundButton} accessibilityLabel="Flip camera">
                <CameraRotate size={22} color={colors.white} weight="bold" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: CAMERA_FALLBACK_BACKGROUND,
    flex: 1,
    overflow: 'hidden'
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    paddingBottom: 210,
    paddingHorizontal: 20,
    paddingTop: 96
  },
  overlayImage: {
    height: '100%',
    width: '100%'
  },
  previewFade: {
    bottom: 0,
    height: '46%',
    left: 0,
    position: 'absolute',
    right: 0
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
    top: 54,
    zIndex: 2
  },
  titlePill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.pill,
    flex: 1,
    marginHorizontal: 10,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  titlePillText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center'
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  toolButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  toolButtonActive: {
    backgroundColor: 'rgba(55, 214, 176, 0.18)',
    borderColor: 'rgba(55, 214, 176, 0.45)',
    borderWidth: 1
  },
  floatingControls: {
    bottom: 0,
    gap: 10,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    zIndex: 3
  },
  toolsBar: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  stripPillOuter: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  stripPill: {
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: CAMERA_FALLBACK_BACKGROUND,
    justifyContent: 'center',
    paddingHorizontal: 28
  },
  fallbackTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8
  },
  fallbackBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    textAlign: 'center'
  },
  settingsButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  settingsButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800'
  },
  shutterRow: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  shutterSide: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  shutter: {
    alignItems: 'center',
    borderColor: colors.white,
    borderRadius: 32,
    borderWidth: 4,
    height: 64,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    width: 64
  },
  shutterInner: {
    backgroundColor: colors.white,
    borderRadius: 24,
    height: 48,
    width: 48
  },
  pressed: {
    opacity: 0.7
  }
});
