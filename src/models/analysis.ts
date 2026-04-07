export type ScoreCategory =
  | 'composition'
  | 'pose'
  | 'camera_angle'
  | 'background'
  | 'lighting'
  | 'framing'
  | 'scene_balance';

export interface Suggestion {
  title: string;
  description: string;
}

export interface CropRectNormalized {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OverlayArrow {
  from: [number, number];
  to: [number, number];
  label?: string;
}

export interface OverlayNote {
  x: number;
  y: number;
  text: string;
}

export interface OverlayData {
  grid?: boolean;
  cropRect?: CropRectNormalized;
  arrows?: OverlayArrow[];
  notes?: OverlayNote[];
}

export interface VisualOutput {
  type: 'annotated_image' | 'overlay_only';
  localRenderedPath?: string;
}

export interface AnalysisResult {
  analysisId: string;
  overallScore: number;
  subscores: Partial<Record<ScoreCategory, number>>;
  summary: string;
  strengths: string[];
  issues: string[];
  suggestions: Suggestion[];
  overlayData?: OverlayData;
  visualOutput?: VisualOutput;
  createdAt: string;
  originalImageUri: string;
}

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  mimeType: string;
  fileSize?: number;
}
