import { create } from 'zustand';

import { AnalysisResult, PickedPhoto } from '../../models/analysis';
import { loadHistory, persistHistory } from '../../services/storage/historyStorage';

export type CameraMode = 'classic' | 'pose_ai';

interface AnalysisStore {
  currentPhoto?: PickedPhoto;
  currentResult?: AnalysisResult;
  recentResults: AnalysisResult[];
  isAnalyzing: boolean;
  error?: string;
  historyLoaded: boolean;
  cameraMode: CameraMode;
  poseAiSelectedTemplateId?: string;

  setCurrentPhoto: (photo: PickedPhoto) => void;
  setAnalyzing: (value: boolean) => void;
  setCurrentResult: (result: AnalysisResult) => void;
  addRecentResult: (result: AnalysisResult) => Promise<void>;
  removeRecentResult: (analysisId: string) => Promise<void>;
  setRecentResults: (results: AnalysisResult[]) => void;
  hydrateHistory: () => Promise<void>;
  setError: (message?: string) => void;
  setCameraMode: (mode: CameraMode) => void;
  setPoseAiSelectedTemplateId: (templateId?: string) => void;
  clearCurrent: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  recentResults: [],
  isAnalyzing: false,
  historyLoaded: false,
  cameraMode: 'classic',

  setCurrentPhoto: photo => set({ currentPhoto: photo, error: undefined }),
  setAnalyzing: value => set({ isAnalyzing: value }),
  setCurrentResult: result => set({ currentResult: result }),
  setRecentResults: results => set({ recentResults: results, historyLoaded: true }),
  addRecentResult: async result => {
    const existing = get().recentResults.filter(item => item.analysisId !== result.analysisId);
    const next = [result, ...existing].slice(0, 20);
    set({ recentResults: next });
    await persistHistory(next);
  },
  removeRecentResult: async analysisId => {
    const next = get().recentResults.filter(item => item.analysisId !== analysisId);
    set({ recentResults: next });
    await persistHistory(next);
  },
  hydrateHistory: async () => {
    if (get().historyLoaded) return;
    const results = await loadHistory();
    set({ recentResults: results, historyLoaded: true });
  },
  setError: message => set({ error: message }),
  setCameraMode: mode => set({ cameraMode: mode }),
  setPoseAiSelectedTemplateId: templateId => set({ poseAiSelectedTemplateId: templateId }),
  clearCurrent: () => set({ currentPhoto: undefined, currentResult: undefined, error: undefined })
}));
