import { CameraIntent } from '../../core/navigation/navigationTypes';
import { TrackingManager } from './TrackingManager';
import { TrackingFlowType } from './trackingTypes';

export function trackingFlowTypeFromIntent(intent: CameraIntent): TrackingFlowType {
  if (intent.type === 'coach') return 'ai_coach';
  if (intent.type === 'tool') return 'editing_tool';
  return 'photo_recipe';
}

export function trackingParamsFromIntent(intent: CameraIntent, source: string) {
  if (intent.type === 'coach') {
    return {
      intent_type: intent.type,
      coach_mode: 'comprehensive',
      source
    };
  }
  if (intent.type === 'tool') {
    return {
      intent_type: intent.type,
      tool_id: intent.toolId,
      source
    };
  }
  return {
    intent_type: intent.type,
    recipe_id: intent.recipeId,
    source
  };
}

export function startTrackedCameraFlow(intent: CameraIntent, source: string) {
  const flowType = trackingFlowTypeFromIntent(intent);
  void TrackingManager.flow.start(flowType, trackingParamsFromIntent(intent, source));
  void TrackingManager.flow.cameraOpened(trackingParamsFromIntent(intent, source));
}

export function toTrackingFlowType(flowType: string): TrackingFlowType {
  if (flowType === 'aiCoach') return 'ai_coach';
  if (flowType === 'editingTool') return 'editing_tool';
  if (flowType === 'photoRecipe') return 'photo_recipe';
  return 'pose';
}
