import { useCallback } from 'react';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { toUserMessage } from '../../services/errors/appError';
import { analyzePhoto as runAnalyzePhoto } from '../../services/openai/analyzePhoto';

import { DirectCoachService } from '../../services/coach/DirectCoachService';
import { AnalysisResult } from '../../models/analysis';

export function useAnalyzePhoto() {
  const setAnalyzing = useAnalysisStore(state => state.setAnalyzing);
  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);
  const setError = useAnalysisStore(state => state.setError);
  const selectedPhotoAiTool = useAnalysisStore(state => state.selectedPhotoAiTool);
  const coachMode = useAnalysisStore(state => state.coachMode);

  const analyze = useCallback(async (imageUri: string, mimeType: string) => {
    try {
      setError(undefined);
      setAnalyzing(true);
      
      let parsed: AnalysisResult;
      
      if (selectedPhotoAiTool === 'ai_coach' && coachMode !== 'comprehensive') {
        const generatedUri = await DirectCoachService.generateCoachImage(imageUri, mimeType, coachMode as any);
        parsed = {
          analysisId: Date.now().toString(),
          flowType: 'aiCoach',
          overallAssessment: `Visual guidance generated for ${coachMode} mode.`,
          suggestions: [{
            title: `Direct Image Coach (${coachMode})`,
            concept: "AI generated visual guidance overlay",
            composition: "",
            camera_angle: "",
            changes: ["Visual overlay applied"],
            image_prompt: ""
          }],
          createdAt: new Date().toISOString(),
          originalImageUri: imageUri,
          originalImageMimeType: mimeType,
          suggestionGenerations: [{
            suggestionIndex: 0,
            generatedImageUri: generatedUri
          }]
        };
      } else {
        parsed = await runAnalyzePhoto(imageUri, mimeType, selectedPhotoAiTool, coachMode);
      }
      
      setCurrentResult(parsed);
      return parsed;
    } catch (error) {
      setError(toUserMessage(error));
      throw error;
    } finally {
      setAnalyzing(false);
    }
  }, [selectedPhotoAiTool, coachMode, setAnalyzing, setCurrentResult, setError]);

  return { analyze };
}
