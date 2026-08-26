import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';

import { CameraLogScope, logCameraLifecycle, logCameraLifecycleError } from './cameraLifecycleLog';
import { useCameraAppLifecycle } from './useCameraAppLifecycle';
import { useCameraReadyWatchdog } from './useCameraReadyWatchdog';

export interface CapturedStill {
  uri: string;
  width: number;
  height: number;
}

interface UseDeviceCameraOptions {
  scope?: CameraLogScope;
  poseId?: string;
}

export function useDeviceCamera(options: UseDeviceCameraOptions = {}) {
  const scope = options.scope ?? 'pose';
  const poseId = options.poseId;

  const cameraRef = useRef<CameraView>(null);
  const mountErrorRetryCountRef = useRef(0);
  const [cameraPermission, requestCameraPermission, getCameraPermission] = useCameraPermissions();
  const { appState, isCameraRuntimeActive, cameraSessionKey, bumpCameraSession } = useCameraAppLifecycle({
    scope,
    poseId
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');

  const cameraPreviewEnabled = Boolean(cameraPermission?.granted && isCameraRuntimeActive);

  const retryCameraSession = useCallback(
    (reason: string) => {
      if (mountErrorRetryCountRef.current >= 1) {
        logCameraLifecycle(scope, 'session-retry-skipped', {
          reason,
          cameraSessionKey,
          poseId,
          retryCount: mountErrorRetryCountRef.current
        });
        return;
      }

      mountErrorRetryCountRef.current += 1;
      logCameraLifecycle(scope, 'session-retry', {
        reason,
        cameraSessionKey,
        poseId,
        retryCount: mountErrorRetryCountRef.current
      });
      bumpCameraSession(reason);
    },
    [bumpCameraSession, cameraSessionKey, poseId, scope]
  );

  const { markCameraReady } = useCameraReadyWatchdog({
    scope,
    enabled: cameraPreviewEnabled,
    cameraSessionKey,
    poseId,
    onTimeout: () => {
      retryCameraSession('ready-timeout');
    }
  });

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      logCameraLifecycle(scope, 'request-permission-auto', {
        poseId,
        granted: cameraPermission.granted,
        canAskAgain: cameraPermission.canAskAgain,
        status: cameraPermission.status
      });
      void requestCameraPermission();
    }
  }, [cameraPermission, poseId, requestCameraPermission, scope]);

  useEffect(() => {
    logCameraLifecycle(scope, 'permission-state', {
      poseId,
      granted: cameraPermission?.granted,
      canAskAgain: cameraPermission?.canAskAgain,
      status: cameraPermission?.status,
      expires: cameraPermission?.expires
    });
  }, [cameraPermission, poseId, scope]);

  useEffect(() => {
    if (appState === 'active') {
      void getCameraPermission();
    }
  }, [appState, getCameraPermission]);

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Settings unavailable', 'Please open Settings and allow camera access for ShotCoach AI.');
    }
  }, []);

  const swapCamera = useCallback(() => {
    if (isCapturing) return;
    setCameraFacing(current => {
      const nextFacing = current === 'back' ? 'front' : 'back';
      logCameraLifecycle(scope, 'facing-changed', {
        poseId,
        from: current,
        to: nextFacing
      });
      return nextFacing;
    });
  }, [isCapturing, poseId, scope]);

  const toggleFlash = useCallback(() => {
    setFlashMode(current => {
      const nextMode = current === 'off' ? 'on' : 'off';
      logCameraLifecycle(scope, 'flash-changed', {
        poseId,
        from: current,
        to: nextMode
      });
      return nextMode;
    });
  }, [poseId, scope]);

  const takeStillPhoto = useCallback(async (): Promise<CapturedStill | null> => {
    if (isCapturing) {
      logCameraLifecycle(scope, 'capture-skipped-busy', { poseId });
      return null;
    }

    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission.granted) {
      logCameraLifecycle(scope, 'capture-denied-permission', {
        poseId,
        status: permission.status,
        canAskAgain: permission.canAskAgain
      });
      Alert.alert('Permission needed', 'Please allow camera access in Settings to take a photo.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openSettings }
      ]);
      return null;
    }

    try {
      setIsCapturing(true);
      logCameraLifecycle(scope, 'capture-start', { poseId, cameraSessionKey });
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
      if (!photo?.uri) {
        logCameraLifecycle(scope, 'capture-empty-result', { poseId, cameraSessionKey });
        return null;
      }
      logCameraLifecycle(scope, 'capture-success', {
        poseId,
        cameraSessionKey,
        width: photo.width,
        height: photo.height
      });
      return {
        uri: photo.uri,
        width: photo.width,
        height: photo.height
      };
    } catch (error) {
      logCameraLifecycleError(scope, 'capture-failed', {
        poseId,
        cameraSessionKey,
        message: error instanceof Error ? error.message : String(error)
      });
      Alert.alert('Capture failed', 'Please try taking the photo again.');
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [cameraPermission, cameraSessionKey, isCapturing, openSettings, poseId, requestCameraPermission, scope]);

  const handleMountError = useCallback(
    (event?: { message?: string }) => {
      logCameraLifecycleError(scope, 'mount-error', {
        poseId,
        message: event?.message ?? 'Unknown camera mount error',
        cameraSessionKey,
        isCameraRuntimeActive,
        permissionGranted: cameraPermission?.granted,
        appState: AppState.currentState,
        facing: cameraFacing,
        flashMode,
        retryCount: mountErrorRetryCountRef.current
      });
      retryCameraSession('mount-error');
    },
    [
      cameraFacing,
      cameraPermission?.granted,
      cameraSessionKey,
      flashMode,
      isCameraRuntimeActive,
      poseId,
      retryCameraSession,
      scope
    ]
  );

  const handleCameraReady = useCallback(() => {
    mountErrorRetryCountRef.current = 0;
    markCameraReady({
      facing: cameraFacing,
      flashMode
    });
  }, [cameraFacing, flashMode, markCameraReady]);

  const logPreviewBranch = useCallback(
    (branch: 'preparing-permission' | 'no-permission' | 'inactive' | 'camera-view') => {
      logCameraLifecycle(scope, `render-${branch}`, {
        poseId,
        cameraSessionKey,
        isCameraRuntimeActive,
        granted: cameraPermission?.granted,
        status: cameraPermission?.status,
        appState: AppState.currentState
      });
    },
    [
      cameraPermission?.granted,
      cameraPermission?.status,
      cameraSessionKey,
      isCameraRuntimeActive,
      poseId,
      scope
    ]
  );

  return {
    cameraRef,
    cameraPermission,
    isAppActive: isCameraRuntimeActive,
    cameraSessionKey,
    isCapturing,
    cameraFacing,
    flashMode,
    cameraPreviewEnabled,
    openSettings,
    swapCamera,
    toggleFlash,
    takeStillPhoto,
    handleMountError,
    handleCameraReady,
    logPreviewBranch
  };
}
