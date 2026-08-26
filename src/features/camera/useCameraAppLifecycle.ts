import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { CameraLogScope, logCameraLifecycle } from './cameraLifecycleLog';

interface Options {
  scope: CameraLogScope;
  poseId?: string;
  intentType?: string;
  recipeId?: string;
  toolId?: string;
}

function isBackgroundAppState(state: AppStateStatus) {
  return state === 'background';
}

export function useCameraAppLifecycle({ scope, poseId, intentType, recipeId, toolId }: Options) {
  const isFocused = useIsFocused();
  const appStateRef = useRef(AppState.currentState);
  const [appState, setAppState] = useState(AppState.currentState);
  const [cameraSessionKey, setCameraSessionKey] = useState(0);
  const hasInitializedRef = useRef(false);

  const isCameraRuntimeActive = isFocused && !isBackgroundAppState(appState);

  const logContext = {
    poseId,
    intentType,
    recipeId,
    toolId
  };

  useEffect(() => {
    logCameraLifecycle(scope, 'lifecycle-mounted', {
      ...logContext,
      appState: appStateRef.current,
      isFocused
    });

    return () => {
      logCameraLifecycle(scope, 'lifecycle-unmounted', logContext);
    };
  }, [intentType, isFocused, poseId, recipeId, scope, toolId]);

  useEffect(() => {
    hasInitializedRef.current = true;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const previousState = appStateRef.current;

      logCameraLifecycle(scope, 'app-state-change', {
        ...logContext,
        previousState,
        nextState,
        isFocused
      });

      appStateRef.current = nextState;
      setAppState(nextState);

      if (
        nextState === 'active' &&
        isBackgroundAppState(previousState) &&
        hasInitializedRef.current
      ) {
        logCameraLifecycle(scope, 'session-reset-returning-foreground', logContext);
        setCameraSessionKey(current => current + 1);
      }
    });

    return () => subscription.remove();
  }, [intentType, isFocused, poseId, recipeId, scope, toolId]);

  useEffect(() => {
    logCameraLifecycle(scope, 'runtime-activity-changed', {
      ...logContext,
      isFocused,
      appState,
      isCameraRuntimeActive,
      cameraSessionKey
    });
  }, [appState, cameraSessionKey, intentType, isCameraRuntimeActive, isFocused, poseId, recipeId, scope, toolId]);

  const bumpCameraSession = useCallback(
    (reason: string) => {
      logCameraLifecycle(scope, 'session-bump', {
        reason,
        ...logContext,
        cameraSessionKey
      });
      setCameraSessionKey(current => current + 1);
    },
    [cameraSessionKey, intentType, poseId, recipeId, scope, toolId]
  );

  return {
    appState,
    isFocused,
    isCameraRuntimeActive,
    cameraSessionKey,
    bumpCameraSession
  };
}
