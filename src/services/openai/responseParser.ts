import { AnalysisResult, Suggestion } from '../../models/analysis';

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

export function parseAnalysisResponse(
  raw: unknown,
  originalImageUri: string,
  originalImageMimeType = 'image/jpeg'
): AnalysisResult {
  const jsonText = extractJsonTextFromResponse(raw).replace(/^```json\s*|\s*```$/g, '');
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;

  return {
    analysisId: `${Date.now()}`,
    overallAssessment: asString(parsed.overall_assessment),
    suggestions: normalizeSuggestions(parsed.suggestions).slice(0, 3),
    visualOutput: {
      type: 'overlay_only'
    },
    createdAt: new Date().toISOString(),
    originalImageUri,
    originalImageMimeType
  };
}

function normalizeSuggestions(value: unknown): Suggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => item as Record<string, unknown>)
    .filter(item => typeof item.title === 'string' && typeof item.image_prompt === 'string')
    .map(item => ({
      title: asString(item.title),
      concept: asString(item.concept),
      composition: asString(item.composition),
      camera_angle: asString(item.camera_angle),
      changes: asStringArray(item.changes),
      image_prompt: asString(item.image_prompt)
    }))
    .filter(item => item.title.length > 0);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asMarkdownString(value: unknown): string {
  return asString(value).replace(/\\n/g, '\n').trim();
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
