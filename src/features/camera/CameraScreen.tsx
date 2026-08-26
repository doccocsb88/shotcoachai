import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ActivityIndicator, AppState, Image, Linking, Platform, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CaretLeft, Lightning, DotsThreeVertical, MagicWand, X, Images, CameraRotate, CameraSlash, LightningSlash } from 'phosphor-react-native';

import { DEFAULT_COACH_MODE, useAnalysisStore } from '../../core/store/analysisStore';
import { Screen } from '../../components/common/Screen';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { PickedPhoto } from '../../models/analysis';
import { UserAccessState, UserManager } from '../../services/user/UserManager';
import { getFreeCaptureLimit } from '../../services/user/usageLimits';
import { CameraIntent } from '../../core/navigation/navigationTypes';
import { getPhotoAiTool } from '../../models/photoAiTool';
import { getPhotoRecipe } from '../../services/photo-recipes/photoRecipeLibrary';
import { useAnalyzePhoto } from '../analysis/useAnalyzePhoto';
import { generateEditedImage } from '../../services/openai/generateImage';
import { DirectCoachService } from '../../services/coach/DirectCoachService';
import { TrackingManager } from '../../services/tracking/TrackingManager';
import { logCameraLifecycle, logCameraLifecycleError } from './cameraLifecycleLog';
import { useCameraAppLifecycle } from './useCameraAppLifecycle';
import { useCameraReadyWatchdog } from './useCameraReadyWatchdog';

const USE_DIRECT_COACH_FLOW = true;
const comprehensiveCoachImage = require('../../../assets/coaches/comprehensive.png');


interface Props {
  onBack: () => void;
  onPhotoSelected: () => void;
  onCoachReferenceCreated?: (uri: string) => void;
  onOpenPaywall: () => void;
  referenceImageUri?: string | null;
  intent?: CameraIntent;
}

const navBarTopPadding = Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + spacing.md;
const dockBottomPadding = Platform.OS === 'ios' ? 32 : spacing.sm;
const cameraFallbackBackground = '#05070B';
const focusTopInset = navBarTopPadding + 88;
const focusBottomInset = dockBottomPadding + 132;
const supportsNativeLensSelection = Platform.OS === 'android';

function logCoachCamera(event: string, payload?: Record<string, unknown>) {
  logCameraLifecycle('coach', event, payload);
}

export function CameraScreen({
  onBack,
  onPhotoSelected,
  onCoachReferenceCreated,
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
  const intentType = intent?.type;
  const recipeId = intent?.type === 'recipe' ? intent.recipeId : undefined;
  const toolId = intent?.type === 'tool' ? intent.toolId : undefined;
  const { isCameraRuntimeActive, cameraSessionKey, bumpCameraSession } = useCameraAppLifecycle({
    scope: 'coach',
    intentType,
    recipeId,
    toolId
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [lens, setLens] = useState<string | undefined>(undefined);
  const [zoom, setZoom] = useState(0);
  const [activeZoomLevel, setActiveZoomLevel] = useState<'0.5' | '1' | '2'>('1');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [availableLenses, setAvailableLenses] = useState<string[]>([]);
  
  const findLensByKeywords = useCallback((keywords: string[]) => {
    return availableLenses.find(item => {
      const normalized = item.toLowerCase();
      return keywords.some(keyword => normalized.includes(keyword));
    });
  }, [availableLenses]);

  const applyZoomPreset = useCallback((level: '0.5' | '1' | '2') => {
    if (level === '0.5') {
      setZoom(0);
      return;
    }

    if (level === '1') {
      setZoom(0.02);
      return;
    }

    setZoom(0.08);
  }, []);

  const handleZoomSelect = (level: '0.5' | '1' | '2') => {
    setActiveZoomLevel(level);

    if (!supportsNativeLensSelection) {
      setLens(undefined);
      applyZoomPreset(level);
      return;
    }

    if (level === '0.5') {
      const ultraWideLens = findLensByKeywords(['ultra wide', 'ultrawide']);
      if (ultraWideLens) {
        setLens(ultraWideLens);
        setZoom(0);
      } else {
        setLens(undefined);
        setZoom(0);
      }
    } else if (level === '1') {
      const wideLens = findLensByKeywords(['back camera', 'wide']);
      setLens(wideLens);
      setZoom(0);
    } else if (level === '2') {
      const telephotoLens = findLensByKeywords(['telephoto']);
      if (telephotoLens) {
        setLens(telephotoLens);
        setZoom(0);
      } else {
        const wideLens = findLensByKeywords(['back camera', 'wide']);
        setLens(wideLens);
        setZoom(0.05);
      }
    }
  };
  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);
  const clearCurrent = useAnalysisStore(state => state.clearCurrent);
  const addRecentResult = useAnalysisStore(state => state.addRecentResult);
  const coachPreferences = useAnalysisStore(state => state.coachPreferences);
  const isAnalyzing = useAnalysisStore(state => state.isAnalyzing);
  const { analyze } = useAnalyzePhoto();
  const [accessState, setAccessState] = useState<UserAccessState>(UserManager.getState());
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [realtimeGeneratedImageUri, setRealtimeGeneratedImageUri] = useState<string | null>(null);
  const referenceWidth = Math.round((width * 2) / 5);
  const mountErrorRetryCountRef = useRef(0);
  const cameraPreviewEnabled = Boolean(cameraPermission?.granted && isCameraRuntimeActive);

  const retryCameraSession = useCallback(
    (reason: string) => {
      if (mountErrorRetryCountRef.current >= 1) {
        logCoachCamera('session-retry-skipped', {
          reason,
          cameraSessionKey,
          intentType,
          recipeId,
          toolId,
          retryCount: mountErrorRetryCountRef.current
        });
        return;
      }

      mountErrorRetryCountRef.current += 1;
      logCoachCamera('session-retry', {
        reason,
        cameraSessionKey,
        intentType,
        recipeId,
        toolId,
        retryCount: mountErrorRetryCountRef.current
      });
      bumpCameraSession(reason);
    },
    [bumpCameraSession, cameraSessionKey, intentType, recipeId, toolId]
  );

  const { markCameraReady } = useCameraReadyWatchdog({
    scope: 'coach',
    enabled: cameraPreviewEnabled,
    cameraSessionKey,
    intentType,
    recipeId,
    toolId,
    onTimeout: () => {
      retryCameraSession('ready-timeout');
    }
  });

  logCoachCamera('render', {
    intentType: intent?.type,
    recipeId: intent?.type === 'recipe' ? intent.recipeId : undefined,
    granted: cameraPermission?.granted,
    status: cameraPermission?.status,
    isCameraRuntimeActive,
    cameraSessionKey,
    lens,
    availableLensesCount: availableLenses.length
  });

  useEffect(() => {
    const unsubscribe = UserManager.subscribe(setAccessState);
    void UserManager.refresh();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (intent?.type !== 'coach') {
      setRealtimeGeneratedImageUri(null);
    }
  }, [intent?.type]);

  useEffect(() => {
    if (intent?.type !== 'coach') {
      return;
    }

    if (!referenceImageUri) {
      setRealtimeGeneratedImageUri(null);
    }
  }, [intent?.type, referenceImageUri]);

  const coachReferencePreviewUri = referenceImageUri ?? realtimeGeneratedImageUri;

  const clearRealtimeState = useCallback(() => {
    setRealtimeGeneratedImageUri(null);
  }, []);

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      logCoachCamera('request-permission-auto', {
        granted: cameraPermission.granted,
        canAskAgain: cameraPermission.canAskAgain,
        status: cameraPermission.status
      });
      void requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  useEffect(() => {
    logCoachCamera('permission-state', {
      granted: cameraPermission?.granted,
      canAskAgain: cameraPermission?.canAskAgain,
      status: cameraPermission?.status,
      expires: cameraPermission?.expires
    });
  }, [cameraPermission]);

  useEffect(() => {
    if (AppState.currentState === 'active') {
      void getCameraPermission();
    }
  }, [getCameraPermission]);

  useEffect(() => {
    if (!supportsNativeLensSelection) {
      return;
    }

    if (availableLenses.length === 0) {
      return;
    }

    setLens(currentLens => {
      if (currentLens && availableLenses.includes(currentLens)) {
        return currentLens;
      }

      const defaultWideLens = findLensByKeywords(['back camera', 'wide']);
      const nextLens = defaultWideLens ?? undefined;
      logCoachCamera('default-lens-selected', {
        currentLens,
        nextLens,
        availableLenses
      });
      return nextLens;
    });
  }, [availableLenses, findLensByKeywords]);

  const openCameraSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Settings unavailable', 'Please open Settings and allow camera access for ShotCoach AI.');
    }
  };

  const showCaptureLimitPaywall = () => {
    const freeCaptureLimit = getFreeCaptureLimit();
    Alert.alert(
      'Unlock unlimited captures',
      `Free users can capture up to ${freeCaptureLimit} photos. Upgrade to ShotCoach Pro for unlimited shooting.`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Upgrade', onPress: onOpenPaywall }
      ]
    );
  };

  const ensureCaptureAllowed = async (): Promise<boolean> => {
    await UserManager.ensureReady();
    if (!UserManager.canStartCapture()) {
      showCaptureLimitPaywall();
      return false;
    }
    return true;
  };

  const choosePhoto = async () => {
    if (!(await ensureCaptureAllowed())) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      void TrackingManager.flow.photoRejected('permission_denied');
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
    if (!(await ensureCaptureAllowed())) return;

    const permission = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();
    if (!permission.granted) {
      void TrackingManager.flow.photoRejected('permission_denied');
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
      void TrackingManager.flow.photoRejected('capture_failed');
      Alert.alert('Capture failed', 'Please try taking the photo again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const swapCamera = () => {
    if (isCapturing) return;
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleCoachPhotoFlow = async (picked: PickedPhoto) => {
    useAnalysisStore.getState().setSelectedPhotoAiTool('ai_coach');

    const hasCoachReference = Boolean(referenceImageUri);
    if (hasCoachReference) {
      onPhotoSelected();
      return;
    }

    clearRealtimeState();

    try {
      if (USE_DIRECT_COACH_FLOW) {
        setIsGeneratingImage(true);
        const generatedUri = await DirectCoachService.generateCoachImage(
          picked.uri,
          picked.mimeType,
          DEFAULT_COACH_MODE,
          coachPreferences
        );
        setRealtimeGeneratedImageUri(generatedUri);
        onCoachReferenceCreated?.(generatedUri);
        setCurrentResult({
          analysisId: `direct_coach:${DEFAULT_COACH_MODE}`,
          flowType: 'aiCoach',
          overallAssessment: 'Visual guidance generated by AI Coach.',
          suggestions: [{
            title: 'Direct Image Coach',
            concept: 'AI generated visual guidance overlay',
            composition: '',
            camera_angle: '',
            changes: ['Visual overlay applied'],
            image_prompt: ''
          }],
          createdAt: new Date().toISOString(),
          originalImageUri: picked.uri,
          originalImageMimeType: picked.mimeType,
          suggestionGenerations: [{ suggestionIndex: 0, generatedImageUri: generatedUri }],
          generatedImageUri: generatedUri,
          selectedSuggestionIndex: 0
        });
      } else {
        const parsed = await analyze(picked.uri, picked.mimeType);
        const imagePrompt = parsed.suggestions[0]?.image_prompt;
        if (imagePrompt) {
          setIsGeneratingImage(true);
          const generatedUri = await generateEditedImage(imagePrompt, picked.uri, picked.mimeType, 'ai_coach');
          setRealtimeGeneratedImageUri(generatedUri);
          const historyResult = { ...parsed };
          if (historyResult.suggestions?.[0]) {
            historyResult.suggestions[0] = {
              ...historyResult.suggestions[0],
              result_image_url: generatedUri
            };
          }
          void addRecentResult(historyResult);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePickerResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    if (asset.width < 512 || asset.height < 512) {
      void TrackingManager.flow.photoRejected('too_small');
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
    void TrackingManager.flow.photoSelected('gallery');
    setCurrentPhoto(picked);
    if (cameraMode === 'pose_ai') {
      setPoseAiSelectedTemplateId(undefined);
    }

    if (intent?.type === 'coach') {
      await handleCoachPhotoFlow(picked);
      return;
    }

    clearRealtimeState();
    onPhotoSelected();
  };

  const handleCapturedPhoto = async (asset: { uri: string; width: number; height: number }) => {
    if (asset.width < 512 || asset.height < 512) {
      void TrackingManager.flow.photoRejected('too_small');
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
    void TrackingManager.flow.photoSelected('camera');
    setCurrentPhoto(picked);
    if (cameraMode === 'pose_ai') {
      setPoseAiSelectedTemplateId(undefined);
    }

    if (intent?.type === 'coach') {
      await handleCoachPhotoFlow(picked);
      return;
    }

    onPhotoSelected();
  };

  const renderCameraPreview = () => {
    if (!cameraPermission) {
      logCoachCamera('render-fallback-preparing-permission', {
        intentType,
        recipeId,
        toolId,
        appState: AppState.currentState
      });
      return (
        <View style={styles.cameraFallback}>
          <Text style={styles.cameraFallbackText}>Preparing camera</Text>
        </View>
      );
    }

    if (!cameraPermission.granted) {
      logCoachCamera('render-fallback-no-permission', {
        granted: cameraPermission.granted,
        canAskAgain: cameraPermission.canAskAgain,
        status: cameraPermission.status
      });
      return (
        <View style={styles.cameraFallback}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconWrap}>
              <CameraSlash size={34} color={colors.primary} weight="regular" />
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

    if (!isCameraRuntimeActive) {
      logCoachCamera('render-fallback-inactive', {
        appState: AppState.currentState,
        cameraSessionKey
      });
      return (
        <View style={styles.cameraFallback}>
          <Text style={styles.cameraFallbackText}>Resuming camera…</Text>
        </View>
      );
    }

    logCoachCamera('render-camera-view', {
      cameraSessionKey,
      intentType,
      recipeId,
      toolId,
      facing: cameraFacing,
      lens,
      zoom,
      flashMode
    });

    return (
      <CameraView
        key={cameraSessionKey}
        ref={cameraRef}
        active={isCameraRuntimeActive}
        facing={cameraFacing}
        flash={flashMode}
        style={styles.cameraView}
        selectedLens={
          supportsNativeLensSelection && lens && availableLenses.includes(lens)
            ? lens
            : undefined
        }
        zoom={zoom}
        barcodeScannerSettings={undefined}
        enableTorch={false}
        mode="picture"
        onCameraReady={() => {
          mountErrorRetryCountRef.current = 0;
          markCameraReady({
            facing: cameraFacing,
            lens,
            selectedLensProp: lens && availableLenses.includes(lens) ? lens : undefined,
            zoom,
            flashMode
          });
        }}
        onMountError={event => {
          logCameraLifecycleError('coach', 'mount-error', {
            message: event?.message ?? 'Unknown camera mount error',
            cameraSessionKey,
            isCameraRuntimeActive,
            permissionGranted: cameraPermission?.granted,
            appState: AppState.currentState,
            facing: cameraFacing,
            lens,
            zoom,
            flashMode,
            intentType,
            recipeId,
            toolId,
            retryCount: mountErrorRetryCountRef.current
          });
          retryCameraSession('mount-error');
        }}
        onAvailableLensesChanged={(event: any) => {
          if (!supportsNativeLensSelection) {
            return;
          }

          logCoachCamera('available-lenses-changed', {
            eventLenses: event?.lenses,
            nativeEventLenses: event?.nativeEvent?.lenses
          });
          if (event?.lenses && event.lenses.length > 0) {
            setAvailableLenses(event.lenses);
          } else if (event?.nativeEvent?.lenses && event.nativeEvent.lenses.length > 0) {
            setAvailableLenses(event.nativeEvent.lenses);
          }
        }}
      />
    );
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
          
          {(isAnalyzing || isGeneratingImage) && (
            <View style={styles.realtimeLoadingOverlay}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.realtimeLoadingText}>
                {isAnalyzing ? 'Analyzing shot...' : 'Generating reference...'}
              </Text>
            </View>
          )}

          {!accessState.isPremium ? (
            <Text style={styles.freeQuotaPill}>
              {UserManager.remainingFreeCaptures()} free capture{UserManager.remainingFreeCaptures() === 1 ? '' : 's'} left
            </Text>
          ) : null}
          {intent?.type === 'coach' && coachReferencePreviewUri ? (
            <View style={[styles.referencePreview, { width: referenceWidth }]}>
              <Image 
                source={{ uri: coachReferencePreviewUri }} 
                style={styles.referencePreviewImage} 
                resizeMode="cover" 
              />
              <View style={styles.referencePreviewLabel}>
                <Text style={styles.referencePreviewLabelText}>Reference</Text>
              </View>
              {!referenceImageUri && realtimeGeneratedImageUri ? (
                <Pressable onPress={clearRealtimeState} style={styles.referencePreviewClose}>
                  <X size={20} color="rgba(255,255,255,0.6)" weight="bold" />
                </Pressable>
              ) : null}
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
            <CaretLeft size={28} color="#FFF" weight="bold" />
          </Pressable>
          <View style={styles.navCenter}>
            <Pressable style={styles.featurePill}>
              <View style={styles.featurePillIcon}>
                <MagicWand size={16} color="#FFF" weight="bold" />
              </View>
              <View>
                <Text style={styles.featurePillTitle}>
                  {intent?.type === 'coach' ? 'AI Coach' :
                   intent?.type === 'tool' ? (getPhotoAiTool(intent.toolId)?.shortTitle ?? 'Quick Edit') : 
                   intent?.type === 'recipe' ? (getPhotoRecipe(intent.recipeId)?.title ?? 'Recipe') : 'Quick Edit'}
                </Text>
                <Text style={styles.featurePillSubtitle}>
                  {intent?.type === 'coach' ? 'Real-time guidance' : 
                   intent?.type === 'tool' ? 'AI Edit Tool' : 
                   intent?.type === 'recipe' ? 'Photo Recipe' : 'AI guidance'}
                </Text>
              </View>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              accessibilityLabel={flashMode === 'on' ? 'Turn flash off' : 'Turn flash on'}
              accessibilityRole="button"
              style={styles.navIconButton}
              onPress={() => setFlashMode(f => (f === 'off' ? 'on' : 'off'))}
            >
              {flashMode === 'on' ? (
                <Lightning size={24} color="#FBBF24" weight="fill" />
              ) : (
                <LightningSlash size={24} color="#FFF" weight="bold" />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.zoomContainer}>
          <Pressable onPress={() => handleZoomSelect('0.5')} style={[styles.zoomButton, activeZoomLevel === '0.5' && styles.zoomButtonActive]}>
            <Text style={[styles.zoomText, activeZoomLevel === '0.5' && styles.zoomTextActive]}>0.5</Text>
          </Pressable>
          <Pressable onPress={() => handleZoomSelect('1')} style={[styles.zoomButton, activeZoomLevel === '1' && styles.zoomButtonActive]}>
            <Text style={[styles.zoomText, activeZoomLevel === '1' && styles.zoomTextActive]}>1x</Text>
          </Pressable>
          <Pressable onPress={() => handleZoomSelect('2')} style={[styles.zoomButton, activeZoomLevel === '2' && styles.zoomButtonActive]}>
            <Text style={[styles.zoomText, activeZoomLevel === '2' && styles.zoomTextActive]}>2</Text>
          </Pressable>
        </View>

        <View style={[styles.bottomDock, { paddingBottom: dockBottomPadding }]}>
          <View style={styles.leftDockContent}>
            <Pressable
              accessibilityLabel="Open photo library"
              accessibilityRole="button"
              onPress={choosePhoto}
              style={({ pressed }) => [styles.galleryThumbWrap, pressed && styles.pressed]}
            >
              <Images size={28} color="#FFF" weight="fill" />
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel="Capture photo"
            accessibilityRole="button"
            onPress={takePhoto}
            disabled={isCapturing}
            style={({ pressed }) => [styles.captureButton, { zIndex: 10 }, (pressed || isCapturing) && styles.pressed]}
          >
            {intent?.type === 'coach' ? (
              <Image
                source={comprehensiveCoachImage}
                style={styles.captureInnerImage}
              />
            ) : (
              <View style={styles.captureInner} />
            )}
          </Pressable>
          <View style={styles.rightDockContent}>
            <Pressable
              accessibilityLabel={`Switch to ${cameraFacing === 'back' ? 'front' : 'back'} camera`}
              accessibilityRole="button"
              disabled={isCapturing}
              onPress={swapCamera}
              style={({ pressed }) => [styles.swapCameraButton, (pressed || isCapturing) && styles.pressed]}
            >
              <CameraRotate size={28} color="#FFF" weight="bold" />
            </Pressable>
          </View>
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
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
    zIndex: 2
  },
  leftDockContent: {
    flex: 1,
    alignItems: 'flex-start'
  },
  rightDockContent: {
    flex: 1,
    alignItems: 'flex-end'
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
  captureInnerImage: {
    borderRadius: 35,
    height: 70,
    width: 70,
    overflow: 'hidden'
  },
  pressed: {
    opacity: 0.75
  },
  realtimeLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  realtimeLoadingText: {
    color: colors.white,
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600'
  },
  realtimeGuidanceOverlay: {
    position: 'absolute',
    top: navBarTopPadding + 140,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    borderRadius: 16,
    padding: 16,
    zIndex: 10,
    maxHeight: 200,
    ...shadows.card
  },
  realtimeGuidanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  realtimeGuidanceTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '800'
  },
  realtimeGuidanceClose: {
    padding: 4
  },
  realtimeGuidanceCloseText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600'
  },
  realtimeGuidanceScroll: {
    flexGrow: 0
  },
  realtimeGuidanceText: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500'
  }
});
