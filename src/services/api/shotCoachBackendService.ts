import { CoachMode } from '../../core/store/analysisStore';
import { AnalysisResult, ImageQualityEvaluation } from '../../models/analysis';
import { CoachPreferences } from '../../models/coachPreferences';
import { PhotoAiToolId } from '../../models/photoAiTool';
import { PhotoRecipe } from '../../models/photoRecipe';
import { AppError } from '../errors/appError';
import { fileToBase64 } from '../image/fileToBase64';
import { normalizeFileUri, persistImageFile } from '../image/persistentImage';
import { COACH_IMAGE_PRESET, ResizeImageOptions, resizeImageIfNeeded } from '../image/resizeImage';
import { saveBase64ImageToCache } from '../image/saveBase64Image';
import { withTimeout } from '../../utils/async';
import {
  ApiClient,
  CoachAnalyzeResponse,
  GeneratedImageResponse,
  PromptImageEditResponse,
  ShotCoachApiError,
  shotCoachApiClient
} from './ApiClient';
import { shouldDebugOpenAIFlow } from '../openai/debugOpenAIFlow';

const ANALYSIS_TIMEOUT_MS = 90_000;
const GENERATION_TIMEOUT_MS = 90_000;
const LOCAL_STEP_TIMEOUT_MS = 20_000;

export async function analyzePhotoWithBackend(input: {
  imageUri: string;
  mimeType: string;
  toolId?: PhotoAiToolId;
  coachMode?: CoachMode;
  coachPreferences?: CoachPreferences;
  client?: ApiClient;
}): Promise<AnalysisResult> {
  const client = input.client ?? shotCoachApiClient;
  const optimized = await withTimeout(
    resizeImageIfNeeded(input.imageUri, input.mimeType, input.toolId === 'ai_coach' ? COACH_IMAGE_PRESET : undefined),
    LOCAL_STEP_TIMEOUT_MS,
    'Image resize timeout'
  );
  const imageBase64 = await withTimeout(
    fileToBase64(normalizeFileUri(optimized.uri)),
    LOCAL_STEP_TIMEOUT_MS,
    'Image read timeout'
  );
  const persistedOriginalUri = await withTimeout(
    persistImageFile(input.imageUri, 'original-photo'),
    LOCAL_STEP_TIMEOUT_MS,
    'Image persist timeout'
  );

  const response = await withTimeout(
    client.analyzePhoto({
      imageBase64,
      mimeType: optimized.mimeType,
      toolId: input.toolId ?? 'ai_coach',
      coachMode: input.coachMode ?? 'comprehensive',
      coachPreferences: input.coachPreferences,
      flowVersion: 'v2',
      originalImageUri: persistedOriginalUri,
      originalImageMimeType: input.mimeType
    }),
    ANALYSIS_TIMEOUT_MS,
    'Backend analysis timeout'
  );

  logBackendRequestResponse('analyze', {
    route: '/api/v1/coach/analyze',
    toolId: input.toolId ?? 'ai_coach',
    mimeType: optimized.mimeType,
    imageBase64Length: imageBase64.length,
    coachMode: input.coachMode ?? 'comprehensive',
    hasCoachPreferences: Boolean(input.coachPreferences && Object.keys(input.coachPreferences).length > 0),
    responseSummary: {
      analysisId: response.analysisId,
      suggestionCount: response.suggestions.length,
      flowType: response.flowType ?? 'aiCoach'
    }
  });

  return mapAnalyzeResponseToResult(response, persistedOriginalUri, input.mimeType);
}

export async function generateDirectCoachImageWithBackend(input: {
  imageUri: string;
  mimeType: string;
  coachMode: CoachMode;
  coachPreferences?: CoachPreferences;
  client?: ApiClient;
}): Promise<string> {
  const client = input.client ?? shotCoachApiClient;
  const prepared = await prepareImagePayload(input.imageUri, input.mimeType, COACH_IMAGE_PRESET);
  try {
    const response = await withTimeout(
      client.directEdit({
        imageBase64: prepared.imageBase64,
        mimeType: prepared.mimeType,
        coachMode: input.coachMode,
        coachPreferences: input.coachPreferences
      }),
      GENERATION_TIMEOUT_MS,
      'Direct coach generation timeout'
    );

    logBackendRequestResponse('direct-edit', {
      route: '/api/v1/coach/direct-edit',
      toolId: 'ai_coach',
      mimeType: prepared.mimeType,
      imageBase64Length: prepared.imageBase64.length,
      coachMode: input.coachMode,
      hasCoachPreferences: Boolean(input.coachPreferences && Object.keys(input.coachPreferences).length > 0),
      responseSummary: summarizeImageResponse(response)
    });

    return saveGeneratedImageResponse(response, 'shotcoach-direct');
  } catch (error) {
    logBackendRequestError('direct-edit', {
      route: '/api/v1/coach/direct-edit',
      toolId: 'ai_coach',
      mimeType: prepared.mimeType,
      imageBase64Length: prepared.imageBase64.length,
      coachMode: input.coachMode,
      hasCoachPreferences: Boolean(input.coachPreferences && Object.keys(input.coachPreferences).length > 0),
      error: summarizeError(error)
    });
    throw error;
  }
}

export async function generateEditedImageWithBackend(input: {
  prompt: string;
  originalImageUri: string;
  originalImageMimeType?: string;
  toolId?: PhotoAiToolId;
  evaluateQuality?: boolean;
  selectedDirection?: unknown;
  client?: ApiClient;
}): Promise<{ generatedImageUri: string; qualityEvaluation?: ImageQualityEvaluation }> {
  const client = input.client ?? shotCoachApiClient;
  const prepared = await prepareImagePayload(input.originalImageUri, input.originalImageMimeType ?? 'image/jpeg');
  const hasRecipeMarker = input.prompt.includes('Selected flow: Photo Recipes.');
  const response = await withTimeout(
    client.editImage({
      imageBase64: prepared.imageBase64,
      mimeType: prepared.mimeType,
      prompt: input.prompt,
      toolId: input.toolId ?? 'ai_coach',
      evaluateQuality: input.evaluateQuality ?? false,
      selectedDirection: input.selectedDirection as { title: string } | undefined,
      originalImageBase64: input.evaluateQuality ? prepared.imageBase64 : undefined
    }),
    GENERATION_TIMEOUT_MS,
    'Backend image generation timeout'
  );

  logBackendRequestResponse('image-edit', {
    route: '/api/v1/images/edit',
    toolId: input.toolId ?? 'ai_coach',
    mimeType: prepared.mimeType,
    imageBase64Length: prepared.imageBase64.length,
    evaluateQuality: input.evaluateQuality ?? false,
    hasRecipeMarker,
    promptPreview: input.prompt.slice(0, 280),
    responseSummary: summarizeImageResponse(response)
  });

  return {
    generatedImageUri: await saveGeneratedImageResponse(response, 'shotcoach-edit'),
    qualityEvaluation: response.qualityEvaluation
  };
}

export async function generateToolEditedImageWithBackend(input: {
  toolId: Exclude<PhotoAiToolId, 'ai_coach' | 'photo_recipe'>;
  instruction?: string;
  originalImageUri: string;
  originalImageMimeType?: string;
  evaluateQuality?: boolean;
  selectedDirection?: unknown;
  client?: ApiClient;
}): Promise<{ generatedImageUri: string; qualityEvaluation?: ImageQualityEvaluation }> {
  const client = input.client ?? shotCoachApiClient;
  const prepared = await prepareImagePayload(input.originalImageUri, input.originalImageMimeType ?? 'image/jpeg');
  const response = await withTimeout(
    client.toolEdit({
      imageBase64: prepared.imageBase64,
      mimeType: prepared.mimeType,
      toolId: input.toolId,
      instruction: input.instruction,
      evaluateQuality: input.evaluateQuality ?? false,
      selectedDirection: input.selectedDirection as { title: string } | undefined,
      originalImageBase64: input.evaluateQuality ? prepared.imageBase64 : undefined
    }),
    GENERATION_TIMEOUT_MS,
    'Backend tool edit timeout'
  );

  logBackendRequestResponse('image-edit', {
    route: '/api/v1/tools/edit',
    toolId: input.toolId,
    mimeType: prepared.mimeType,
    imageBase64Length: prepared.imageBase64.length,
    evaluateQuality: input.evaluateQuality ?? false,
    instructionPreview: input.instruction?.slice(0, 280),
    responseSummary: summarizeImageResponse(response)
  });

  return {
    generatedImageUri: await saveGeneratedImageResponse(response, 'shotcoach-tool'),
    qualityEvaluation: response.qualityEvaluation
  };
}

export async function applyRecipeWithBackend(input: {
  recipe: PhotoRecipe;
  originalImageUri: string;
  originalImageMimeType?: string;
  evaluateQuality?: boolean;
  selectedDirection?: unknown;
  client?: ApiClient;
}): Promise<{ generatedImageUri: string; qualityEvaluation?: ImageQualityEvaluation }> {
  const client = input.client ?? shotCoachApiClient;
  const prepared = await prepareImagePayload(input.originalImageUri, input.originalImageMimeType ?? 'image/jpeg');
  const response = await withTimeout(
    client.recipeApply({
      imageBase64: prepared.imageBase64,
      mimeType: prepared.mimeType,
      recipe: input.recipe,
      evaluateQuality: input.evaluateQuality ?? false,
      selectedDirection: input.selectedDirection as { title: string } | undefined,
      originalImageBase64: input.evaluateQuality ? prepared.imageBase64 : undefined
    }),
    GENERATION_TIMEOUT_MS,
    'Backend recipe apply timeout'
  );

  logBackendRequestResponse('image-edit', {
    route: '/api/v1/recipes/apply',
    toolId: 'photo_recipe',
    mimeType: prepared.mimeType,
    imageBase64Length: prepared.imageBase64.length,
    evaluateQuality: input.evaluateQuality ?? false,
    recipeId: input.recipe.id,
    recipeName: input.recipe.name ?? input.recipe.title,
    responseSummary: summarizeImageResponse(response)
  });

  return {
    generatedImageUri: await saveGeneratedImageResponse(response, 'shotcoach-recipe'),
    qualityEvaluation: response.qualityEvaluation
  };
}

async function prepareImagePayload(imageUri: string, mimeType: string, options?: ResizeImageOptions) {
  const optimized = await withTimeout(
    resizeImageIfNeeded(imageUri, mimeType, options),
    LOCAL_STEP_TIMEOUT_MS,
    'Image resize timeout'
  );
  const imageBase64 = await withTimeout(
    fileToBase64(normalizeFileUri(optimized.uri)),
    LOCAL_STEP_TIMEOUT_MS,
    'Image read timeout'
  );

  return {
    imageBase64,
    mimeType: optimized.mimeType
  };
}

async function saveGeneratedImageResponse(
  response: GeneratedImageResponse | PromptImageEditResponse,
  filePrefix: string
): Promise<string> {
  if (!response.generatedImageBase64) {
    throw new AppError('INVALID_RESPONSE', 'No generated image returned from backend.');
  }

  return saveBase64ImageToCache(response.generatedImageBase64, filePrefix);
}

function mapAnalyzeResponseToResult(
  response: CoachAnalyzeResponse,
  originalImageUri: string,
  originalImageMimeType: string
): AnalysisResult {
  return {
    analysisId: response.analysisId,
    flowType: response.flowType ?? 'aiCoach',
    overallAssessment: response.overallAssessment,
    suggestions: response.suggestions,
    coachAnalysisV2: response.coachAnalysisV2,
    coachDirectionsV2: response.coachDirectionsV2,
    createdAt: response.createdAt,
    originalImageUri: response.originalImageUri ?? originalImageUri,
    originalImageMimeType: response.originalImageMimeType ?? originalImageMimeType
  };
}

export function isBackendApiError(error: unknown): error is ShotCoachApiError {
  return error instanceof ShotCoachApiError;
}

function logBackendRequestResponse(
  stage: 'analyze' | 'direct-edit' | 'image-edit',
  payload: Record<string, unknown>
) {
  if (!shouldDebugOpenAIFlow()) {
    return;
  }

  console.log(`[ShotCoach][Backend][${stage}]`, payload);
}

function logBackendRequestError(
  stage: 'analyze' | 'direct-edit' | 'image-edit',
  payload: Record<string, unknown>
) {
  if (!shouldDebugOpenAIFlow()) {
    return;
  }

  console.error(`[ShotCoach][Backend][${stage}][error]`, payload);
}

function summarizeImageResponse(response: GeneratedImageResponse | PromptImageEditResponse) {
  return {
    model: response.model,
    size: response.size,
    generatedImageBase64Length: response.generatedImageBase64?.length ?? 0,
    promptUsedPreview: response.promptUsed?.slice(0, 280),
    hasQualityEvaluation: 'qualityEvaluation' in response && Boolean(response.qualityEvaluation)
  };
}

function summarizeError(error: unknown) {
  if (error instanceof ShotCoachApiError) {
    return {
      name: error.name,
      message: error.message,
      status: error.status,
      details: error.details
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return {
    message: String(error)
  };
}
