export interface Suggestion {
  title: string;
  concept: string;
  /** Stronger framing / crop / negative space (optional for legacy stored results). */
  composition?: string;
  /** Recommended lens height and focal feel (optional for legacy stored results). */
  camera_angle?: string;
  changes: string[];
  image_prompt: string;
}

export interface ProductionPhotoAnalysis {
  schema_version: string;
  photo_id: string;
  analysis_id: string;
  scene: {
    photo_type: string;
    environment: string;
    visible_subjects?: string;
  };
  composition: {
    quality_score: number;
    notes: string;
  };
  lighting: {
    quality_score: number;
    notes: string;
  };
  pose: {
    quality_score: number;
    notes: string;
  };
  aesthetic: {
    overall_score: number;
    notes: string;
  };
  scores: {
    composition_score: number;
    lighting_score: number;
    pose_score: number;
    naturalness_score: number;
    social_media_score: number;
    overall_aesthetic_score: number;
  };
  overall_assessment: string;
}

export interface CoachPhotoAnalysisV2 {
  schema_version: string;
  photo_id: string;
  scene: {
    photo_type: string;
    environment: string;
    background_description: string;
    weather_or_time_of_day: string;
    scene_mood: string;
  };
  subject: {
    subject_count: number;
    pose_description: string;
    expression_description: string;
    outfit_description: string;
    identity_risk_level: 'low' | 'medium' | 'high' | 'unknown';
    identity_risk_notes: string;
  };
  composition: {
    quality_score: number;
    notes: string;
    safe_improvements: string[];
    avoid_changes: string[];
  };
  lighting: {
    quality_score: number;
    lighting_type: string;
    notes: string;
    preserve_rules: string[];
  };
  pose: {
    quality_score: number;
    notes: string;
    safe_pose_refinements: string[];
    unsafe_pose_changes: string[];
  };
  aesthetic: {
    overall_score: number;
    notes: string;
    style_preservation: string[];
  };
  scores: {
    composition_score: number;
    lighting_score: number;
    pose_score: number;
    subject_separation_score: number;
    naturalness_score: number;
    social_media_score: number;
    overall_aesthetic_score: number;
  };
  overall_assessment: string;
}

export interface CreativeDirection {
  title: string;
  concept: string;
  composition: string;
  camera_angle: string;
  changes: {
    pose: string[];
    lighting: string[];
    composition: string[];
    style: string[];
  };
}

export interface CoachDirectionV2 {
  id: string;
  title: string;
  summary: string;
  composition_change: string;
  camera_distance_change: string;
  subject_placement_change: string;
  pose_refinement: string;
  lighting_preservation: string;
  edit_strength: 'low' | 'medium' | 'high' | 'unknown';
  identity_risk: 'low' | 'medium' | 'high' | 'unknown';
  prompt_builder_notes: string[];
}

export interface GenerationRecipe {
  direction_title: string;
  model: {
    provider: string;
    name: string;
  };
  image_prompt: {
    positive_prompt: string;
    negative_prompt: string;
  };
  evaluation_targets: {
    identity_preservation: number;
    naturalness: number;
    anatomy_score: number;
    overall_score: number;
  };
}

export interface ImageQualityEvaluation {
  identity_preservation: number;
  naturalness: number;
  anatomy_score: number;
  overall_score: number;
  retry_required: boolean;
  retry_reason: string;
  recommended_action: string;
}

export interface CropRectNormalized {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OverlayArrow {
  from: [number, number];
  to: [number, number];
  label?: string;
}

export interface OverlayNote {
  x: number;
  y: number;
  text: string;
}

export interface OverlayData {
  grid?: boolean;
  cropRect?: CropRectNormalized;
  arrows?: OverlayArrow[];
  notes?: OverlayNote[];
}

export interface VisualOutput {
  type: 'annotated_image' | 'overlay_only' | 'generated_image';
  localRenderedPath?: string;
  generatedImageUri?: string;
  generationStatus?: 'completed' | 'failed';
  generationError?: string;
}

/** One completed image edit tied to a suggestion index (0-based). */
export interface SuggestionGenerationEntry {
  suggestionIndex: number;
  generatedImageUri: string;
  qualityEvaluation?: ImageQualityEvaluation;
}

export type FlowType = 'aiCoach' | 'photoRecipe' | 'editingTool';

export interface AnalysisResult {
  analysisId: string;
  flowType?: FlowType;
  sourceAnalysisId?: string;
  overallAssessment: string;
  suggestions: Suggestion[];
  productionAnalysis?: ProductionPhotoAnalysis;
  coachAnalysisV2?: CoachPhotoAnalysisV2;
  creativeDirections?: CreativeDirection[];
  coachDirectionsV2?: CoachDirectionV2[];
  generationRecipes?: GenerationRecipe[];
  createdAt: string;
  originalImageUri: string;
  /** MIME type of the original upload (used for OpenAI image edit multipart). */
  originalImageMimeType?: string;
  selectedSuggestionIndex?: number;
  /** Latest single edit (mirrors last entry in suggestionGenerations when set). */
  generatedImageUri?: string;
  /** All edits persisted per suggestion; preferred over legacy fields alone. */
  suggestionGenerations?: SuggestionGenerationEntry[];
  visualOutput?: VisualOutput;
}

/** URI of a previously completed edit for this suggestion, if any. */
export function getStoredGenerationUri(result: AnalysisResult, suggestionIndex: number): string | undefined {
  const fromList = result.suggestionGenerations?.find(g => g.suggestionIndex === suggestionIndex);
  if (fromList?.generatedImageUri) {
    return fromList.generatedImageUri;
  }
  if (result.selectedSuggestionIndex === suggestionIndex && result.generatedImageUri) {
    return result.generatedImageUri;
  }
  return undefined;
}

/** Number of suggestions that have a saved AI edit (for list UI). */
export function countStoredSuggestionEdits(result: AnalysisResult): number {
  if (result.suggestionGenerations?.length) {
    return result.suggestionGenerations.length;
  }
  return result.generatedImageUri ? 1 : 0;
}

/** Merge a new edit into history fields; preserves other suggestion entries and legacy single-edit when migrating. */
export function mergeSuggestionGeneration(
  result: AnalysisResult,
  suggestionIndex: number,
  generatedImageUri: string,
  qualityEvaluation?: ImageQualityEvaluation
): AnalysisResult {
  let base: SuggestionGenerationEntry[] = [...(result.suggestionGenerations ?? [])];
  if (
    base.length === 0 &&
    result.generatedImageUri &&
    typeof result.selectedSuggestionIndex === 'number' &&
    result.selectedSuggestionIndex !== suggestionIndex
  ) {
    base.push({
      suggestionIndex: result.selectedSuggestionIndex,
      generatedImageUri: result.generatedImageUri
    });
  }
  base = base.filter(g => g.suggestionIndex !== suggestionIndex);
  base.push({ suggestionIndex, generatedImageUri, qualityEvaluation });
  return {
    ...result,
    suggestionGenerations: base,
    generatedImageUri,
    selectedSuggestionIndex: suggestionIndex
  };
}

export function createGeneratedHistoryResult(
  result: AnalysisResult,
  suggestionIndex: number,
  generatedImageUri: string,
  qualityEvaluation?: ImageQualityEvaluation
): AnalysisResult {
  return {
    ...result,
    analysisId: `${result.sourceAnalysisId ?? result.analysisId}:generated:${suggestionIndex}:${Date.now()}`,
    sourceAnalysisId: result.sourceAnalysisId ?? result.analysisId,
    selectedSuggestionIndex: suggestionIndex,
    generatedImageUri,
    suggestionGenerations: [
      {
        suggestionIndex,
        generatedImageUri,
        qualityEvaluation
      }
    ],
    visualOutput: {
      type: 'generated_image',
      generatedImageUri,
      generationStatus: 'completed'
    },
    createdAt: new Date().toISOString()
  };
}

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  mimeType: string;
  fileSize?: number;
}

export function getFlowType(result: AnalysisResult): FlowType {
  if (result.flowType) {
    return result.flowType;
  }

  const analysisId = typeof result.analysisId === 'string' ? result.analysisId : '';
  const sourceAnalysisId = typeof result.sourceAnalysisId === 'string' ? result.sourceAnalysisId : '';
  const targetAnalysisId = sourceAnalysisId.startsWith('recipe:') ? sourceAnalysisId : analysisId;

  if (targetAnalysisId.startsWith('recipe:')) {
    return 'photoRecipe';
  }
  if (analysisId.startsWith('direct:')) {
    return 'editingTool';
  }
  return 'aiCoach';
}
