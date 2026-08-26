export type CameraLogScope = 'coach' | 'pose';

export function logCameraLifecycle(
  scope: CameraLogScope,
  event: string,
  payload?: Record<string, unknown>
) {
  console.log(`[ShotCoach][Camera:${scope}]`, {
    event,
    at: new Date().toISOString(),
    ...payload
  });
}

export function logCameraLifecycleError(
  scope: CameraLogScope,
  event: string,
  payload?: Record<string, unknown>
) {
  console.error(`[ShotCoach][Camera:${scope}]`, {
    event,
    at: new Date().toISOString(),
    ...payload
  });
}
