import { useCallback } from 'react';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { toUserMessage } from '../../services/errors/appError';
import { analyzePhoto as runAnalyzePhoto } from '../../services/openai/analyzePhoto';

export function useAnalyzePhoto() {
  const setAnalyzing = useAnalysisStore(state => state.setAnalyzing);
  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);
  const setError = useAnalysisStore(state => state.setError);
  const selectedPhotoAiTool = useAnalysisStore(state => state.selectedPhotoAiTool);

  const analyze = useCallback(async (imageUri: string, mimeType: string) => {
    try {
      setError(undefined);
      setAnalyzing(true);
      const parsed = await runAnalyzePhoto(imageUri, mimeType, selectedPhotoAiTool);
      setCurrentResult(parsed);
      return parsed;
    } catch (error) {
      setError(toUserMessage(error));
      throw error;
    } finally {
      setAnalyzing(false);
    }
  }, [selectedPhotoAiTool, setAnalyzing, setCurrentResult, setError]);

  return { analyze };
}
