import { useEffect, useRef } from 'react';

import { CameraLogScope, logCameraLifecycle } from './cameraLifecycleLog';

const CAMERA_READY_TIMEOUT_MS = 5000;

interface Options {
  scope: CameraLogScope;
  enabled: boolean;
  cameraSessionKey: number;
  poseId?: string;
  intentType?: string;
  recipeId?: string;
  toolId?: string;
  onTimeout?: () => void;
}

export function useCameraReadyWatchdog(options: Options) {
  const { scope, enabled, cameraSessionKey, poseId, intentType, recipeId, toolId, onTimeout } = options;
  const cameraReadyRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    cameraReadyRef.current = false;
  }, [cameraSessionKey, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const context = { poseId, intentType, recipeId, toolId };

    logCameraLifecycle(scope, 'camera-view-mounted', {
      cameraSessionKey,
      readyTimeoutMs: CAMERA_READY_TIMEOUT_MS,
      ...context
    });

    const timeoutId = setTimeout(() => {
      if (cameraReadyRef.current) {
        return;
      }

      logCameraLifecycle(scope, 'camera-ready-timeout', {
        cameraSessionKey,
        readyTimeoutMs: CAMERA_READY_TIMEOUT_MS,
        ...context
      });
      onTimeoutRef.current?.();
    }, CAMERA_READY_TIMEOUT_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [cameraSessionKey, enabled, intentType, poseId, recipeId, scope, toolId]);

  const markCameraReady = (extra?: Record<string, unknown>) => {
    if (cameraReadyRef.current) {
      return;
    }
    cameraReadyRef.current = true;
    logCameraLifecycle(scope, 'camera-ready', {
      cameraSessionKey,
      poseId,
      intentType,
      recipeId,
      toolId,
      ...extra
    });
  };

  return { markCameraReady };
}
