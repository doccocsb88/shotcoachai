import {
  AnalysisResult,
  CreativeDirection,
  GenerationRecipe,
  ImageQualityEvaluation,
  ProductionPhotoAnalysis,
  Suggestion
} from '../../models/analysis';

export function extractJsonTextFromResponse(raw: unknown): string {
  const typed = raw as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputs = typed?.output ?? [];

  for (const item of outputs) {
    const content = item?.content ?? [];
    for (const c of content) {
      if (c?.type === 'output_text' && typeof c?.text === 'string') {
        return c.text;
      }
    }
  }

  const alternative = raw as { output_text?: string };
  if (typeof alternative.output_text === 'string') {
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

export function normalizeImageQualityEvaluation(value: unknown): ImageQualityEvaluation {
  const item = value as Record<string, unknown>;
  return {
    identity_preservation: asNumber(item.identity_preservation),
    naturalness: asNumber(item.naturalness),
    anatomy_score: asNumber(item.anatomy_score),
    overall_score: asNumber(item.overall_score),
    retry_required: item.retry_required === true,
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
