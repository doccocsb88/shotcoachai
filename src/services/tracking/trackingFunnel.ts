import { TrackingFlowType } from './trackingTypes';

export type FunnelStepName =
  | 'entry'
  | 'recipe_detail'
  | 'pose_detail'
  | 'camera'
  | 'photo'
  | 'preview'
  | 'analysis'
  | 'generation'
  | 'result'
  | 'outcome'
  | 'paywall';

const AI_COACH_STEPS: FunnelStepName[] = [
  'entry',
  'camera',
  'photo',
  'preview',
  'analysis',
  'generation',
  'result',
  'outcome'
];

const EDITING_TOOL_STEPS: FunnelStepName[] = [
  'entry',
  'camera',
  'photo',
  'preview',
  'generation',
  'result',
  'outcome'
];

const PHOTO_RECIPE_STEPS: FunnelStepName[] = [
  'entry',
  'recipe_detail',
  'camera',
  'photo',
  'preview',
  'analysis',
  'generation',
  'result',
  'outcome'
];

const POSE_STEPS: FunnelStepName[] = [
  'entry',
  'pose_detail',
  'camera',
  'photo',
  'preview',
  'outcome'
];

const FLOW_STEP_ORDER: Record<TrackingFlowType, FunnelStepName[]> = {
  ai_coach: AI_COACH_STEPS,
  editing_tool: EDITING_TOOL_STEPS,
  photo_recipe: PHOTO_RECIPE_STEPS,
  pose: POSE_STEPS
};

export function getFunnelStepIndex(flowType: TrackingFlowType, stepName: FunnelStepName): number {
  const order = FLOW_STEP_ORDER[flowType];
  const index = order.indexOf(stepName);
  return index >= 0 ? index + 1 : 0;
}
