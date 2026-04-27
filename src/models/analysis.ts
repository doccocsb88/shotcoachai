export interface Suggestion {
  title: string;
  concept: string;
  /** Stronger framing / crop / negative space (optional for legacy stored results). */
  composition?: string;
  /** Recommended lens height and focal feel (optional for legacy stored results). */
  camera_angle?: string;
  changes: string[];
  image_prompt: string;
}

/** Raw JSON shape from OpenAI Vision before normalization (snake_case). */
export interface PhotoAnalysisVisionSuggestionJson {
  title?: unknown;
  concept?: unknown;
  composition?: unknown;
  camera_angle?: unknown;
  changes?: unknown;
  image_prompt?: unknown;
}

export interface PhotoAnalysisVisionJson {
  overall_assessment?: unknown;
  suggestions?: unknown;
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
  type: 'annotated_image' | 'overlay_only' | 'generated_image';
  localRenderedPath?: string;
  generatedImageUri?: string;
  generationStatus?: 'completed' | 'failed';
  generationError?: string;
}

/** One completed image edit tied to a suggestion index (0-based). */
export interface SuggestionGenerationEntry {
  suggestionIndex: number;
  generatedImageUri: string;
}

export interface AnalysisResult {
  analysisId: string;
  overallAssessment: string;
  suggestions: Suggestion[];
  createdAt: string;
  originalImageUri: string;
  /** MIME type of the original upload (used for OpenAI image edit multipart). */
  originalImageMimeType?: string;
  selectedSuggestionIndex?: number;
  /** Latest single edit (mirrors last entry in suggestionGenerations when set). */
  generatedImageUri?: string;
  /** All edits persisted per suggestion; preferred over legacy fields alone. */
  suggestionGenerations?: SuggestionGenerationEntry[];
  visualOutput?: VisualOutput;
}

/** URI of a previously completed edit for this suggestion, if any. */
export function getStoredGenerationUri(result: AnalysisResult, suggestionIndex: number): string | undefined {
  const fromList = result.suggestionGenerations?.find(g => g.suggestionIndex === suggestionIndex);
  if (fromList?.generatedImageUri) {
    return fromList.generatedImageUri;
  }
  if (result.selectedSuggestionIndex === suggestionIndex && result.generatedImageUri) {
    return result.generatedImageUri;
  }
  return undefined;
}

/** Number of suggestions that have a saved AI edit (for list UI). */
export function countStoredSuggestionEdits(result: AnalysisResult): number {
  if (result.suggestionGenerations?.length) {
    return result.suggestionGenerations.length;
  }
  return result.generatedImageUri ? 1 : 0;
}

/** Merge a new edit into history fields; preserves other suggestion entries and legacy single-edit when migrating. */
export function mergeSuggestionGeneration(
  result: AnalysisResult,
  suggestionIndex: number,
  generatedImageUri: string
): AnalysisResult {
  let base: SuggestionGenerationEntry[] = [...(result.suggestionGenerations ?? [])];
  if (
    base.length === 0 &&
    result.generatedImageUri &&
    typeof result.selectedSuggestionIndex === 'number' &&
    result.selectedSuggestionIndex !== suggestionIndex
  ) {
    base.push({
      suggestionIndex: result.selectedSuggestionIndex,
      generatedImageUri: result.generatedImageUri
    });
  }
  base = base.filter(g => g.suggestionIndex !== suggestionIndex);
  base.push({ suggestionIndex, generatedImageUri });
  return {
    ...result,
    suggestionGenerations: base,
    generatedImageUri,
    selectedSuggestionIndex: suggestionIndex
  };
}

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  mimeType: string;
  fileSize?: number;
}
