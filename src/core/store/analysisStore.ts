import { create } from 'zustand';

import { AnalysisResult, PickedPhoto } from '../../models/analysis';
import { loadHistory, persistHistory } from '../../services/storage/historyStorage';

interface AnalysisStore {
  currentPhoto?: PickedPhoto;
  currentResult?: AnalysisResult;
  recentResults: AnalysisResult[];
  isAnalyzing: boolean;
  error?: string;
  historyLoaded: boolean;

  setCurrentPhoto: (photo: PickedPhoto) => void;
  setAnalyzing: (value: boolean) => void;
  setCurrentResult: (result: AnalysisResult) => void;
  addRecentResult: (result: AnalysisResult) => Promise<void>;
  setRecentResults: (results: AnalysisResult[]) => void;
  hydrateHistory: () => Promise<void>;
  setError: (message?: string) => void;
  clearCurrent: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  recentResults: [],
  isAnalyzing: false,
  historyLoaded: false,

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
  hydrateHistory: async () => {
    if (get().historyLoaded) return;
    const results = await loadHistory();
    set({ recentResults: results, historyLoaded: true });
  },
  setError: message => set({ error: message }),
  clearCurrent: () => set({ currentPhoto: undefined, currentResult: undefined, error: undefined })
}));
