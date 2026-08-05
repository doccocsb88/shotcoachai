import { ImageQualityEvaluation } from '../../models/analysis';
import { PhotoAiToolId } from '../../models/photoAiTool';
import {
  generateDirectCoachImageWithBackend,
  generateEditedImageWithBackend
} from '../api/shotCoachBackendService';

export async function generateEditedImage(
  prompt: string,
  originalImageUri: string,
  originalImageMimeType?: string,
  editingToolId?: PhotoAiToolId
): Promise<string> {
  const result = await generateEditedImageWithBackend({
    prompt,
    originalImageUri,
    originalImageMimeType,
    toolId: editingToolId ?? 'ai_coach'
  });

  return result.generatedImageUri;
}

export async function generateDirectCoachImage(
  imageUri: string,
  mimeType: string,
  coachMode: 'composition' | 'frame' | 'angle' | 'pose' | 'comprehensive',
  coachPreferences?: {
    gender?: 'female' | 'male' | 'non_binary';
    ageRange?: 'under_18' | '18_24' | '25_34' | '35_44' | '45_plus';
    sceneContext?:
      | 'travel'
      | 'street'
      | 'cafe'
      | 'beach'
      | 'nature'
      | 'urban_night'
      | 'indoor'
      | 'restaurant'
      | 'landmark';
    editIntensity?: 'safe' | 'balanced' | 'aggressive';
  }
): Promise<string> {
  return generateDirectCoachImageWithBackend({
    imageUri,
    mimeType,
    coachMode,
    coachPreferences
  });
}

export async function evaluateEditedImageQuality(input: {
  originalImageUri: string;
  generatedImageUri: string;
  originalImageMimeType?: string;
  selectedDirection: unknown;
}): Promise<ImageQualityEvaluation | undefined> {
  void input;
  return undefined;
}
