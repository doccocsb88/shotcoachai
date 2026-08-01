import { create } from 'zustand';

import { AnalysisResult, PickedPhoto } from '../../models/analysis';
import { DEFAULT_PHOTO_AI_TOOL_ID, PhotoAiToolId } from '../../models/photoAiTool';
import { loadHistory, persistHistory } from '../../services/storage/historyStorage';

export type CameraMode = 'classic' | 'pose_ai';
export type CoachMode = 'composition' | 'frame' | 'pose' | 'comprehensive';

interface AnalysisStore {
  currentPhoto?: PickedPhoto;
  currentResult?: AnalysisResult;
  recentResults: AnalysisResult[];
  isAnalyzing: boolean;
  error?: string;
  historyLoaded: boolean;
  cameraMode: CameraMode;
  poseAiSelectedTemplateId?: string;
  selectedPhotoAiTool: PhotoAiToolId;
  selectedPhotoAiInstruction?: string;
  coachMode: CoachMode;

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
  setSelectedPhotoAiTool: (toolId: PhotoAiToolId) => void;
  setSelectedPhotoAiEdit: (toolId: PhotoAiToolId, instruction?: string) => void;
  setSelectedPhotoAiInstruction: (instruction?: string) => void;
  setCoachMode: (mode: CoachMode) => void;
  clearCurrent: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  recentResults: [],
  isAnalyzing: false,
  historyLoaded: false,
  cameraMode: 'classic',
  selectedPhotoAiTool: DEFAULT_PHOTO_AI_TOOL_ID,
  coachMode: 'comprehensive',

  setCurrentPhoto: photo =>
    set({
      currentPhoto: photo,
      error: undefined,
      selectedPhotoAiTool: DEFAULT_PHOTO_AI_TOOL_ID,
      selectedPhotoAiInstruction: undefined
    }),
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
  setSelectedPhotoAiTool: toolId => set({ selectedPhotoAiTool: toolId, selectedPhotoAiInstruction: undefined }),
  setSelectedPhotoAiEdit: (toolId, instruction) =>
    set({ selectedPhotoAiTool: toolId, selectedPhotoAiInstruction: instruction }),
  setSelectedPhotoAiInstruction: instruction => set({ selectedPhotoAiInstruction: instruction }),
  setCoachMode: mode => set({ coachMode: mode }),
  clearCurrent: () =>
    set({
      currentPhoto: undefined,
      currentResult: undefined,
      error: undefined,
      selectedPhotoAiTool: DEFAULT_PHOTO_AI_TOOL_ID,
      selectedPhotoAiInstruction: undefined
    })
}));
