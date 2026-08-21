import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';

export interface CapturedStill {
  uri: string;
  width: number;
  height: number;
}

export function useDeviceCamera() {
  const cameraRef = useRef<CameraView>(null);
  const mountErrorRetryCountRef = useRef(0);
  const [cameraPermission, requestCameraPermission, getCameraPermission] = useCameraPermissions();
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [cameraSessionKey, setCameraSessionKey] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      void requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setIsAppActive(nextState === 'active');
      if (nextState === 'active') {
        void getCameraPermission();
        setCameraSessionKey(current => current + 1);
      }
    });
    return () => subscription.remove();
  }, [getCameraPermission]);

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Settings unavailable', 'Please open Settings and allow camera access for ShotCoach AI.');
    }
  }, []);

  const swapCamera = useCallback(() => {
    if (isCapturing) return;
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  }, [isCapturing]);

  const toggleFlash = useCallback(() => {
    setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  }, []);

  const takeStillPhoto = useCallback(async (): Promise<CapturedStill | null> => {
    if (isCapturing) return null;

    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access in Settings to take a photo.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openSettings }
      ]);
      return null;
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
      if (!photo?.uri) return null;
      return {
        uri: photo.uri,
        width: photo.width,
        height: photo.height
      };
    } catch {
      Alert.alert('Capture failed', 'Please try taking the photo again.');
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [cameraPermission, isCapturing, openSettings, requestCameraPermission]);

  const handleMountError = useCallback(() => {
    if (mountErrorRetryCountRef.current >= 1) return;
    mountErrorRetryCountRef.current += 1;
    setCameraSessionKey(current => current + 1);
  }, []);

  const handleCameraReady = useCallback(() => {
    mountErrorRetryCountRef.current = 0;
  }, []);

  return {
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
  };
}
