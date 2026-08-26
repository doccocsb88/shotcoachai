import { AnalysisResult } from '../../models/analysis';
import { CoachPreferences } from '../../models/coachPreferences';
import { CoachMode } from '../../core/store/analysisStore';
import { PhotoAiToolId } from '../../models/photoAiTool';
import { analyzePhotoWithBackend } from '../api/shotCoachBackendService';
import { analyzePhotoWithTestingMockupApi } from './testingMockupApi';
import { withTimeout } from '../../utils/async';
import { persistImageFile } from '../image/persistentImage';
import { parseAnalysisResponse } from './responseParser';

export async function analyzePhoto(
  imageUri: string,
  mimeType: string,
  toolId: PhotoAiToolId = 'ai_coach',
  coachMode: CoachMode = 'comprehensive',
  coachPreferences?: CoachPreferences
): Promise<AnalysisResult> {
  if (shouldUseMockupApi()) {
    const persistentOriginalUri = await withTimeout(
      persistImageFile(imageUri, 'original-photo'),
      20_000,
      'Image persist timeout'
    );
    const raw = await withTimeout(
      analyzePhotoWithTestingMockupApi(),
      90_000,
      'TestingMockup API timeout'
    );
    return parseAnalysisResponse(raw, persistentOriginalUri, mimeType);
  }

  return analyzePhotoWithBackend({
    imageUri,
    mimeType,
    toolId,
    coachMode,
    coachPreferences
  });
}

function shouldUseMockupApi(): boolean {
  const provider = process.env.EXPO_PUBLIC_ANALYSIS_PROVIDER;
  return provider === 'mock' || provider === 'testing_mockup';
}
