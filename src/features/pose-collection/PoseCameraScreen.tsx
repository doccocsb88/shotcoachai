import { CameraView } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraRotate, CaretLeft, Eye, EyeSlash, Lightning, LightningSlash } from 'phosphor-react-native';

import { Screen } from '../../components/common/Screen';
import { colors } from '../../constants/theme';
import { Pose } from '../../models/pose';
import { useDeviceCamera } from '../camera/useDeviceCamera';

interface Props {
  pose: Pose;
  onBack: () => void;
  onCaptured: (photoUri: string) => void;
}

const OVERLAY_OPACITY_PRESETS = [0.3, 0.5, 0.7] as const;

export function PoseCameraScreen({ pose, onBack, onCaptured }: Props) {
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
    handleCameraReady
  } = useDeviceCamera();

  const [overlayOpacity, setOverlayOpacity] = useState<(typeof OVERLAY_OPACITY_PRESETS)[number]>(0.5);
  const [isOverlayHidden, setIsOverlayHidden] = useState(false);
  const [isOverlayMirrored, setIsOverlayMirrored] = useState(false);

  useEffect(() => {
    setIsOverlayMirrored(cameraFacing === 'front');
  }, [cameraFacing]);

  const handleCapture = async () => {
    const still = await takeStillPhoto();
    if (!still) return;
    onCaptured(still.uri);
  };

  const renderPreview = () => {
    if (!cameraPermission?.granted) {
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
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackBody}>Resuming camera…</Text>
        </View>
      );
    }

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
        <View style={styles.preview}>
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

          <View style={styles.topBar}>
            <Pressable onPress={onBack} style={styles.roundButton} accessibilityLabel="Go back">
              <CaretLeft size={24} color={colors.white} weight="bold" />
            </Pressable>
            <View style={styles.titlePill}>
              <Text style={styles.titlePillText}>{pose.title}</Text>
            </View>
            <Pressable onPress={toggleFlash} style={styles.roundButton} accessibilityLabel="Toggle flash">
              {flashMode === 'on' ? (
                <Lightning size={20} color={colors.white} weight="fill" />
              ) : (
                <LightningSlash size={20} color={colors.white} weight="bold" />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.dock}>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Opacity</Text>
            {OVERLAY_OPACITY_PRESETS.map(value => {
              const selected = overlayOpacity === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setOverlayOpacity(value)}
                  style={[styles.opacityChip, selected && styles.opacityChipSelected]}
                >
                  <Text style={[styles.opacityChipText, selected && styles.opacityChipTextSelected]}>
                    {Math.round(value * 100)}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => setIsOverlayMirrored(current => !current)} style={styles.textButton}>
              <Text style={[styles.textButtonLabel, isOverlayMirrored && styles.textButtonOn]}>Mirror</Text>
            </Pressable>
            <Pressable onPress={() => setIsOverlayHidden(current => !current)} style={styles.textButton}>
              {isOverlayHidden ? <EyeSlash size={18} color={colors.white} /> : <Eye size={18} color={colors.white} />}
              <Text style={styles.textButtonLabel}>{isOverlayHidden ? 'Show' : 'Hide'}</Text>
            </Pressable>
          </View>

          <View style={styles.shutterRow}>
            <View style={styles.sideSlot} />
            <Pressable
              disabled={isCapturing}
              onPress={() => void handleCapture()}
              style={[styles.shutter, isCapturing && styles.pressed]}
              accessibilityLabel="Capture photo"
            >
              <View style={styles.shutterInner} />
            </Pressable>
            <Pressable onPress={swapCamera} style={styles.roundButton} accessibilityLabel="Flip camera">
              <CameraRotate size={22} color={colors.white} weight="bold" />
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#05070B',
    flex: 1
  },
  preview: {
    backgroundColor: '#05070B',
    flex: 1,
    overflow: 'hidden'
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 108
  },
  overlayImage: {
    height: '100%',
    width: '100%'
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
    top: 54
  },
  titlePill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  titlePillText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800'
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  fallback: {
    alignItems: 'center',
    flex: 1,
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
    borderRadius: 999,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  settingsButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800'
  },
  dock: {
    backgroundColor: '#05070B',
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 14
  },
  controlRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18
  },
  controlLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4
  },
  opacityChip: {
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  opacityChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  opacityChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800'
  },
  opacityChipTextSelected: {
    color: colors.white
  },
  textButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6
  },
  textButtonLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700'
  },
  textButtonOn: {
    color: colors.accent
  },
  shutterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  sideSlot: {
    width: 44
  },
  shutter: {
    alignItems: 'center',
    borderColor: colors.white,
    borderRadius: 36,
    borderWidth: 4,
    height: 72,
    justifyContent: 'center',
    width: 72
  },
  shutterInner: {
    backgroundColor: colors.white,
    borderRadius: 28,
    height: 56,
    width: 56
  },
  pressed: {
    opacity: 0.7
  }
});
