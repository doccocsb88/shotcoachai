import {
  AnalysisResult,
  CoachDirectionV2,
  CoachPhotoAnalysisV2,
  CreativeDirection,
  GenerationRecipe,
  ImageQualityEvaluation,
  ProductionPhotoAnalysis,
  Suggestion
} from '../../models/analysis';
import { buildAICoachImageEditPrompt } from './promptBuilder';

export function extractJsonTextFromResponse(raw: unknown): string {
  const typed = raw as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputs = typed?.output ?? [];

  for (const item of outputs) {
    const content = item?.content ?? [];
    for (const c of content) {
      if (c?.type === 'output_text' && typeof c?.text === 'string' && c.text.trim().length > 0) {
        return c.text;
      }
    }
  }

  const alternative = raw as { output_text?: string };
  if (typeof alternative.output_text === 'string' && alternative.output_text.trim().length > 0) {
    return alternative.output_text;
  }

  throw new Error('No output text returned from OpenAI');
}

export function parseAnalysisResponse(
  raw: unknown,
  originalImageUri: string,
  originalImageMimeType = 'image/jpeg'
): AnalysisResult {
  const jsonText = extractJsonTextFromResponse(raw).replace(/^```json\s*|\s*```$/g, '');
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;

  return {
    analysisId: `${Date.now()}`,
    overallAssessment: asString(parsed.overall_assessment),
    suggestions: normalizeSuggestions(parsed.suggestions).slice(0, 3),
    visualOutput: {
      type: 'overlay_only'
    },
    createdAt: new Date().toISOString(),
    originalImageUri,
    originalImageMimeType
  };
}

export function parseJsonResponse<T = Record<string, unknown>>(raw: unknown): T {
  const jsonText = extractJsonTextFromResponse(raw)
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/g, '')
    .trim();
  return JSON.parse(jsonText) as T;
}

export function buildAnalysisResultFromProductionFlow(input: {
  photoAnalysis: unknown;
  directionsPayload: unknown;
  recipesPayload: unknown;
  originalImageUri: string;
  originalImageMimeType?: string;
}): AnalysisResult {
  const productionAnalysis = normalizeProductionPhotoAnalysis(input.photoAnalysis);
  const creativeDirections = normalizeCreativeDirections(input.directionsPayload).slice(0, 3);
  const generationRecipes = normalizeGenerationRecipes(input.recipesPayload).slice(0, 3);
  const suggestions = creativeDirections.map((direction, index) =>
    directionToSuggestion(direction, generationRecipes[index])
  );

  return {
    analysisId: productionAnalysis.analysis_id || `${Date.now()}`,
    overallAssessment: productionAnalysis.overall_assessment,
    suggestions,
    productionAnalysis,
    creativeDirections,
    generationRecipes,
    visualOutput: {
      type: 'overlay_only'
    },
    createdAt: new Date().toISOString(),
    originalImageUri: input.originalImageUri,
    originalImageMimeType: input.originalImageMimeType ?? 'image/jpeg'
  };
}

export function buildAnalysisResultFromCoachV2Flow(input: {
  photoAnalysis: unknown;
  directionsPayload: unknown;
  originalImageUri: string;
  originalImageMimeType?: string;
  userInstruction?: string;
}): AnalysisResult {
  const coachAnalysisV2 = normalizeCoachPhotoAnalysisV2(input.photoAnalysis);
  const coachDirectionsV2 = normalizeCoachDirectionsV2(input.directionsPayload).slice(0, 3);
  const suggestions = coachDirectionsV2.map(direction =>
    coachDirectionV2ToSuggestion(coachAnalysisV2, direction, input.userInstruction)
  );

  return {
    analysisId: `coach-v2:${Date.now()}`,
    overallAssessment: coachAnalysisV2.overall_assessment,
    suggestions,
    productionAnalysis: coachAnalysisV2ToLegacyAnalysis(coachAnalysisV2),
    coachAnalysisV2,
    creativeDirections: coachDirectionsV2.map(coachDirectionV2ToLegacyDirection),
    coachDirectionsV2,
    visualOutput: {
      type: 'overlay_only'
    },
    createdAt: new Date().toISOString(),
    originalImageUri: input.originalImageUri,
    originalImageMimeType: input.originalImageMimeType ?? 'image/jpeg'
  };
}

export function normalizeImageQualityEvaluation(value: unknown): ImageQualityEvaluation {
  const item = value as Record<string, unknown>;
  const identityPreservation = asNumber(item.identity_preservation);
  const naturalness = asNumber(item.naturalness);
  const anatomyScore = asNumber(item.anatomy_score);
  const overallScore = asNumber(item.overall_score);
  const thresholdRetryRequired =
    (identityPreservation > 0 && identityPreservation < 8.5) ||
    (naturalness > 0 && naturalness < 8) ||
    (anatomyScore > 0 && anatomyScore < 8) ||
    (overallScore > 0 && overallScore < 8);

  return {
    identity_preservation: identityPreservation,
    naturalness,
    anatomy_score: anatomyScore,
    overall_score: overallScore,
    retry_required: item.retry_required === true || thresholdRetryRequired,
    retry_reason: asString(item.retry_reason),
    recommended_action: asString(item.recommended_action) || 'accept'
  };
}

function normalizeProductionPhotoAnalysis(value: unknown): ProductionPhotoAnalysis {
  const item = value as Record<string, unknown>;
  const scene = asObject(item.scene);
  const composition = asObject(item.composition);
  const lighting = asObject(item.lighting);
  const pose = asObject(item.pose);
  const aesthetic = asObject(item.aesthetic);
  const scores = asObject(item.scores);
  const analysisId = asString(item.analysis_id) || `${Date.now()}`;

  return {
    schema_version: asString(item.schema_version) || '1.0',
    photo_id: asString(item.photo_id) || 'source_photo',
    analysis_id: analysisId,
    scene: {
      photo_type: asString(scene.photo_type) || 'unknown',
      environment: asString(scene.environment) || 'unknown',
      visible_subjects: asString(scene.visible_subjects)
    },
    composition: {
      quality_score: asNumber(composition.quality_score),
      notes: asString(composition.notes)
    },
    lighting: {
      quality_score: asNumber(lighting.quality_score),
      notes: asString(lighting.notes)
    },
    pose: {
      quality_score: asNumber(pose.quality_score),
      notes: asString(pose.notes)
    },
    aesthetic: {
      overall_score: asNumber(aesthetic.overall_score),
      notes: asString(aesthetic.notes)
    },
    scores: {
      composition_score: asNumber(scores.composition_score),
      lighting_score: asNumber(scores.lighting_score),
      pose_score: asNumber(scores.pose_score),
      naturalness_score: asNumber(scores.naturalness_score),
      social_media_score: asNumber(scores.social_media_score),
      overall_aesthetic_score: asNumber(scores.overall_aesthetic_score)
    },
    overall_assessment:
      asString(item.overall_assessment) ||
      [asString(aesthetic.notes), asString(composition.notes), asString(lighting.notes)]
        .filter(Boolean)
        .join(' ')
  };
}

function normalizeCoachPhotoAnalysisV2(value: unknown): CoachPhotoAnalysisV2 {
  const item = value as Record<string, unknown>;
  const scene = asObject(item.scene);
  const subject = asObject(item.subject);
  const composition = asObject(item.composition);
  const lighting = asObject(item.lighting);
  const pose = asObject(item.pose);
  const aesthetic = asObject(item.aesthetic);
  const scores = asObject(item.scores);

  return {
    schema_version: asString(item.schema_version) || '2.0',
    photo_id: asString(item.photo_id) || 'source_photo',
    scene: {
      photo_type: asString(scene.photo_type) || 'unknown',
      environment: asString(scene.environment) || 'unknown',
      background_description: asString(scene.background_description) || asString(scene.environment) || 'unknown',
      weather_or_time_of_day: asString(scene.weather_or_time_of_day) || 'unknown',
      scene_mood: asString(scene.scene_mood) || 'unknown'
    },
    subject: {
      subject_count: asNumber(subject.subject_count) || 1,
      pose_description: asString(subject.pose_description) || 'unknown',
      expression_description: asString(subject.expression_description) || 'unknown',
      outfit_description: asString(subject.outfit_description) || 'unknown',
      identity_risk_level: asRiskLevel(subject.identity_risk_level),
      identity_risk_notes: asString(subject.identity_risk_notes)
    },
    composition: {
      quality_score: asNumber(composition.quality_score),
      notes: asString(composition.notes),
      safe_improvements: asStringArray(composition.safe_improvements),
      avoid_changes: asStringArray(composition.avoid_changes)
    },
    lighting: {
      quality_score: asNumber(lighting.quality_score),
      lighting_type: asString(lighting.lighting_type) || 'unknown',
      notes: asString(lighting.notes),
      preserve_rules: asStringArray(lighting.preserve_rules)
    },
    pose: {
      quality_score: asNumber(pose.quality_score),
      notes: asString(pose.notes),
      safe_pose_refinements: asStringArray(pose.safe_pose_refinements),
      unsafe_pose_changes: asStringArray(pose.unsafe_pose_changes)
    },
    aesthetic: {
      overall_score: asNumber(aesthetic.overall_score),
      notes: asString(aesthetic.notes),
      style_preservation: asStringArray(aesthetic.style_preservation)
    },
    scores: {
      composition_score: asNumber(scores.composition_score),
      lighting_score: asNumber(scores.lighting_score),
      pose_score: asNumber(scores.pose_score),
      subject_separation_score: asNumber(scores.subject_separation_score),
      naturalness_score: asNumber(scores.naturalness_score),
      social_media_score: asNumber(scores.social_media_score),
      overall_aesthetic_score: asNumber(scores.overall_aesthetic_score)
    },
    overall_assessment:
      asString(item.overall_assessment) ||
      [asString(aesthetic.notes), asString(composition.notes), asString(lighting.notes)]
        .filter(Boolean)
        .join(' ')
  };
}

function normalizeCoachDirectionsV2(value: unknown): CoachDirectionV2[] {
  const payload = value as Record<string, unknown>;
  const directions = Array.isArray(payload.directions) ? payload.directions : Array.isArray(value) ? value : [];
  return directions
    .map(item => item as Record<string, unknown>)
    .filter(item => typeof item.title === 'string')
    .map((item, index) => ({
      id: asString(item.id) || `direction_${index + 1}`,
      title: asString(item.title),
      summary: asString(item.summary) || asString(item.concept),
      composition_change: asString(item.composition_change) || asString(item.composition),
      camera_distance_change: asString(item.camera_distance_change),
      subject_placement_change: asString(item.subject_placement_change),
      pose_refinement: asString(item.pose_refinement),
      lighting_preservation: asString(item.lighting_preservation),
      edit_strength: asRiskLevel(item.edit_strength),
      identity_risk: asRiskLevel(item.identity_risk),
      prompt_builder_notes: asStringArray(item.prompt_builder_notes)
    }))
    .filter(item => item.title.length > 0);
}

function coachDirectionV2ToSuggestion(
  analysis: CoachPhotoAnalysisV2,
  direction: CoachDirectionV2,
  userInstruction?: string
): Suggestion {
  const changes = [
    direction.composition_change,
    direction.camera_distance_change,
    direction.subject_placement_change,
    direction.pose_refinement,
    direction.lighting_preservation
  ].filter(Boolean);

  return {
    title: direction.title,
    concept: direction.summary,
    composition: direction.composition_change,
    camera_angle: [direction.camera_distance_change, direction.subject_placement_change].filter(Boolean).join(' '),
    changes,
    image_prompt: buildAICoachImageEditPrompt(analysis, direction, userInstruction)
  };
}

function coachAnalysisV2ToLegacyAnalysis(analysis: CoachPhotoAnalysisV2): ProductionPhotoAnalysis {
  return {
    schema_version: analysis.schema_version,
    photo_id: analysis.photo_id,
    analysis_id: `coach-v2:${Date.now()}`,
    scene: {
      photo_type: analysis.scene.photo_type,
      environment: analysis.scene.environment,
      visible_subjects: [
        analysis.subject.pose_description,
        analysis.subject.expression_description,
        analysis.subject.outfit_description
      ].filter(Boolean).join(' ')
    },
    composition: {
      quality_score: analysis.composition.quality_score,
      notes: analysis.composition.notes
    },
    lighting: {
      quality_score: analysis.lighting.quality_score,
      notes: analysis.lighting.notes
    },
    pose: {
      quality_score: analysis.pose.quality_score,
      notes: analysis.pose.notes
    },
    aesthetic: {
      overall_score: analysis.aesthetic.overall_score,
      notes: analysis.aesthetic.notes
    },
    scores: {
      composition_score: analysis.scores.composition_score,
      lighting_score: analysis.scores.lighting_score,
      pose_score: analysis.scores.pose_score,
      naturalness_score: analysis.scores.naturalness_score,
      social_media_score: analysis.scores.social_media_score,
      overall_aesthetic_score: analysis.scores.overall_aesthetic_score
    },
    overall_assessment: analysis.overall_assessment
  };
}

function coachDirectionV2ToLegacyDirection(direction: CoachDirectionV2): CreativeDirection {
  return {
    title: direction.title,
    concept: direction.summary,
    composition: direction.composition_change,
    camera_angle: [direction.camera_distance_change, direction.subject_placement_change].filter(Boolean).join(' '),
    changes: {
      pose: [direction.pose_refinement].filter(Boolean),
      lighting: [direction.lighting_preservation].filter(Boolean),
      composition: [
        direction.composition_change,
        direction.camera_distance_change,
        direction.subject_placement_change
      ].filter(Boolean),
      style: direction.prompt_builder_notes
    }
  };
}

function normalizeCreativeDirections(value: unknown): CreativeDirection[] {
  const payload = value as Record<string, unknown>;
  const directions = Array.isArray(payload.directions) ? payload.directions : Array.isArray(value) ? value : [];
  return directions
    .map(item => item as Record<string, unknown>)
    .filter(item => typeof item.title === 'string')
    .map(item => {
      const changes = asObject(item.changes);
      return {
        title: asString(item.title),
        concept: asString(item.concept),
        composition: asString(item.composition),
        camera_angle: asString(item.camera_angle),
        changes: {
          pose: asStringArray(changes.pose),
          lighting: asStringArray(changes.lighting),
          composition: asStringArray(changes.composition),
          style: asStringArray(changes.style)
        }
      };
    });
}

function normalizeGenerationRecipes(value: unknown): GenerationRecipe[] {
  const payload = value as Record<string, unknown>;
  const recipes = Array.isArray(payload.recipes) ? payload.recipes : Array.isArray(value) ? value : [];
  return recipes
    .map(item => item as Record<string, unknown>)
    .filter(item => typeof item.direction_title === 'string')
    .map(item => {
      const model = asObject(item.model);
      const imagePrompt = asObject(item.image_prompt);
      const targets = asObject(item.evaluation_targets);
      return {
        direction_title: asString(item.direction_title),
        model: {
          provider: asString(model.provider) || 'openai',
          name: asString(model.name) || 'gpt-image'
        },
        image_prompt: {
          positive_prompt: asString(imagePrompt.positive_prompt),
          negative_prompt: asString(imagePrompt.negative_prompt)
        },
        evaluation_targets: {
          identity_preservation: asNumber(targets.identity_preservation) || 8,
          naturalness: asNumber(targets.naturalness) || 7,
          anatomy_score: asNumber(targets.anatomy_score) || 8,
          overall_score: asNumber(targets.overall_score) || 7
        }
      };
    });
}

function directionToSuggestion(direction: CreativeDirection, recipe?: GenerationRecipe): Suggestion {
  const changes = [
    ...direction.changes.pose,
    ...direction.changes.lighting,
    ...direction.changes.composition,
    ...direction.changes.style
  ];
  const positivePrompt = recipe?.image_prompt.positive_prompt?.trim();
  const negativePrompt = recipe?.image_prompt.negative_prompt?.trim();

  return {
    title: direction.title,
    concept: direction.concept,
    composition: direction.composition,
    camera_angle: direction.camera_angle,
    changes,
    image_prompt: [positivePrompt, negativePrompt ? `Negative prompt: ${negativePrompt}` : '']
      .filter(Boolean)
      .join('\n\n')
  };
}

function normalizeSuggestions(value: unknown): Suggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => item as Record<string, unknown>)
    .filter(item => typeof item.title === 'string' && typeof item.image_prompt === 'string')
    .map(item => ({
      title: asString(item.title),
      concept: asString(item.concept),
      composition: asString(item.composition),
      camera_angle: asString(item.camera_angle),
      changes: asStringArray(item.changes),
      image_prompt: asString(item.image_prompt)
    }))
    .filter(item => item.title.length > 0);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asRiskLevel(value: unknown): 'low' | 'medium' | 'high' | 'unknown' {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'unknown';
}
