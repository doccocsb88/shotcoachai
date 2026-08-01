import { AnalysisResult } from '../../models/analysis';
import { CoachMode } from '../../core/store/analysisStore';
import { PhotoAiToolId } from '../../models/photoAiTool';
import { withTimeout } from '../../utils/async';
import { fileToBase64 } from '../image/fileToBase64';
import { persistImageFile } from '../image/persistentImage';
import { resizeImageIfNeeded } from '../image/resizeImage';
import {
  analyzeCoachPhotoV2WithOpenAI,
  analyzePhotoWithOpenAI,
  composeGenerationRecipesWithOpenAI,
  createCoachDirectionsV2WithOpenAI,
  createCreativeDirectionsWithOpenAI,
  hasOpenAIKey
} from './openaiClient';
import {
  buildAnalysisResultFromCoachV2Flow,
  buildAnalysisResultFromProductionFlow,
  parseAnalysisResponse,
  parseJsonResponse
} from './responseParser';
import { analyzePhotoWithTestingMockupApi } from './testingMockupApi';

const ANALYSIS_TIMEOUT_MS = 90000;
const LOCAL_STEP_TIMEOUT_MS = 20000;

export async function analyzePhoto(
  imageUri: string,
  mimeType: string,
  toolId: PhotoAiToolId = 'ai_coach',
  coachMode: CoachMode = 'comprehensive'
): Promise<AnalysisResult> {
  if (shouldUseMockupApi() || !hasOpenAIKey()) {
    const persistentOriginalUri = await withTimeout(
      persistImageFile(imageUri, 'original-photo'),
      LOCAL_STEP_TIMEOUT_MS,
      'Image persist timeout'
    );
    const raw = await withTimeout(
      analyzePhotoWithTestingMockupApi(),
      ANALYSIS_TIMEOUT_MS,
      'TestingMockup API timeout'
    );
    return parseAnalysisResponse(raw, persistentOriginalUri, mimeType);
  }

  const analysisController = new AbortController();
  const analysisTimeoutId = setTimeout(() => analysisController.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const optimizedUri = await withTimeout(
      resizeImageIfNeeded(imageUri, mimeType),
      LOCAL_STEP_TIMEOUT_MS,
      'Image resize timeout'
    );
    const imageBase64 = await withTimeout(
      fileToBase64(optimizedUri.uri),
      LOCAL_STEP_TIMEOUT_MS,
      'Image read timeout'
    );

    if (shouldUseAiCoachV2(toolId)) {
      const coachAnalysisRaw = await withTimeout(
        analyzeCoachPhotoV2WithOpenAI(imageBase64, optimizedUri.mimeType, coachMode, analysisController.signal),
        ANALYSIS_TIMEOUT_MS,
        'OpenAI AI Coach v2 analysis timeout'
      );
      const photoAnalysis = parseJsonResponse(coachAnalysisRaw);

      const directionsRaw = await withTimeout(
        createCoachDirectionsV2WithOpenAI(
          photoAnalysis,
          imageBase64,
          optimizedUri.mimeType,
          coachMode,
          analysisController.signal
        ),
        ANALYSIS_TIMEOUT_MS,
        'OpenAI AI Coach v2 directions timeout'
      );
      const directionsPayload = parseJsonResponse(directionsRaw);

      const persistentOriginalUri = await withTimeout(
        persistImageFile(imageUri, 'original-photo'),
        LOCAL_STEP_TIMEOUT_MS,
        'Image persist timeout'
      );

      return buildAnalysisResultFromCoachV2Flow({
        photoAnalysis,
        directionsPayload,
        originalImageUri: persistentOriginalUri,
        originalImageMimeType: mimeType
      });
    }

    const visionRaw = await withTimeout(
      analyzePhotoWithOpenAI(imageBase64, optimizedUri.mimeType, analysisController.signal),
      ANALYSIS_TIMEOUT_MS,
      'OpenAI vision analysis timeout'
    );
    const photoAnalysis = parseJsonResponse(visionRaw);

    const directionsRaw = await withTimeout(
      createCreativeDirectionsWithOpenAI(
        photoAnalysis,
        imageBase64,
        optimizedUri.mimeType,
        toolId,
        analysisController.signal
      ),
      ANALYSIS_TIMEOUT_MS,
      'OpenAI creative direction timeout'
    );
    const directionsPayload = parseJsonResponse(directionsRaw);

    const recipesRaw = await withTimeout(
      composeGenerationRecipesWithOpenAI(photoAnalysis, directionsPayload, toolId, analysisController.signal),
      ANALYSIS_TIMEOUT_MS,
      'OpenAI prompt composer timeout'
    );
    const recipesPayload = parseJsonResponse(recipesRaw);

    const persistentOriginalUri = await withTimeout(
      persistImageFile(imageUri, 'original-photo'),
      LOCAL_STEP_TIMEOUT_MS,
      'Image persist timeout'
    );

    return buildAnalysisResultFromProductionFlow({
      photoAnalysis,
      directionsPayload,
      recipesPayload,
      originalImageUri: persistentOriginalUri,
      originalImageMimeType: mimeType
    });
  } finally {
    clearTimeout(analysisTimeoutId);
  }
}

function shouldUseMockupApi(): boolean {
  const provider = process.env.EXPO_PUBLIC_ANALYSIS_PROVIDER;
  return provider === 'mock' || provider === 'testing_mockup';
}

function shouldUseAiCoachV2(toolId: PhotoAiToolId): boolean {
  return toolId === 'ai_coach' && process.env.EXPO_PUBLIC_AI_COACH_FLOW !== 'v1';
}
