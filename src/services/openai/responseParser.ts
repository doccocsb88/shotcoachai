import { AnalysisResult, OverlayData, ScoreCategory, Suggestion } from '../../models/analysis';

const allowedScoreCategories: ScoreCategory[] = [
  'composition',
  'pose',
  'camera_angle',
  'background',
  'lighting',
  'framing',
  'scene_balance'
];

export function extractJsonTextFromResponse(raw: unknown): string {
  const typed = raw as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputs = typed?.output ?? [];

  for (const item of outputs) {
    const content = item?.content ?? [];
    for (const c of content) {
      if (c?.type === 'output_text' && typeof c?.text === 'string') {
        return c.text;
      }
    }
  }

  const alternative = raw as { output_text?: string };
  if (typeof alternative.output_text === 'string') {
    return alternative.output_text;
  }

  throw new Error('No output text returned from OpenAI');
}

export function parseAnalysisResponse(raw: unknown, originalImageUri: string): AnalysisResult {
  const jsonText = extractJsonTextFromResponse(raw).replace(/^```json\s*|\s*```$/g, '');
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;
  const subscores = normalizeSubscores(parsed.subscores);

  return {
    analysisId: `${Date.now()}`,
    overallScore: clampScore(asNumber(parsed.overall_score, 0)),
    subscores,
    summary: asString(parsed.summary),
    strengths: asStringArray(parsed.strengths).slice(0, 3),
    issues: asStringArray(parsed.issues).slice(0, 3),
    suggestions: normalizeSuggestions(parsed.suggestions).slice(0, 3),
    overlayData: normalizeOverlayData(parsed.overlay_data),
    visualOutput: {
      type: 'overlay_only'
    },
    createdAt: new Date().toISOString(),
    originalImageUri
  };
}

function normalizeSubscores(value: unknown): Partial<Record<ScoreCategory, number>> {
  const input = (value ?? {}) as Record<string, unknown>;
  return allowedScoreCategories.reduce<Partial<Record<ScoreCategory, number>>>((acc, key) => {
    if (input[key] !== undefined) {
      acc[key] = clampScore(asNumber(input[key], 0));
    }
    return acc;
  }, {});
}

function normalizeSuggestions(value: unknown): Suggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => item as Record<string, unknown>)
    .filter(item => typeof item.title === 'string' || typeof item.description === 'string')
    .map(item => ({
      title: asString(item.title),
      description: asString(item.description)
    }))
    .filter(item => item.title.length > 0 || item.description.length > 0);
}

function normalizeOverlayData(value: unknown): OverlayData | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const input = value as OverlayData;
  return {
    grid: Boolean(input.grid),
    cropRect: input.cropRect,
    arrows: Array.isArray(input.arrows) ? input.arrows : [],
    notes: Array.isArray(input.notes) ? input.notes : []
  };
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function clampScore(score: number): number {
  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
}
