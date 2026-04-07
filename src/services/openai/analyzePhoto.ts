import { AnalysisResult } from '../../models/analysis';
import { fileToBase64 } from '../image/fileToBase64';
import { resizeImageIfNeeded } from '../image/resizeImage';
import { createMockAnalysisResult } from './mockAnalysis';
import { analyzePhotoWithOpenAI, hasOpenAIKey } from './openaiClient';
import { parseAnalysisResponse } from './responseParser';

export async function analyzePhoto(imageUri: string, mimeType: string): Promise<AnalysisResult> {
  if (!hasOpenAIKey()) {
    await wait(900);
    return createMockAnalysisResult(imageUri);
  }

  const optimizedUri = await resizeImageIfNeeded(imageUri);
  const imageBase64 = await fileToBase64(optimizedUri);
  const raw = await analyzePhotoWithOpenAI(imageBase64, mimeType);
  return parseAnalysisResponse(raw, imageUri);
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
