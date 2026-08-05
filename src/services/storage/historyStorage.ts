import AsyncStorage from '@react-native-async-storage/async-storage';

import { AnalysisResult } from '../../models/analysis';
import { persistImageFile, resolveLocalImageUri } from '../image/persistentImage';

const HISTORY_KEY = '@shotcoach/history';
const HISTORY_LIMIT = 20;

export async function loadHistory(): Promise<AnalysisResult[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Fix changing iOS simulator/device UUIDs
    const resolved = parsed.map(result => resolveHistoryImageUris(result));
    return normalizeLoadedHistory(resolved);
  } catch {
    return [];
  }
}

function resolveHistoryImageUris(result: any): any {
  if (!result) return result;
  
  const originalImageUri = resolveLocalImageUri(result.originalImageUri) || result.originalImageUri;
  const generatedImageUri = result.generatedImageUri ? resolveLocalImageUri(result.generatedImageUri) : undefined;
  
  const suggestionGenerations = result.suggestionGenerations?.map((entry: any) => ({
    ...entry,
    generatedImageUri: entry.generatedImageUri ? resolveLocalImageUri(entry.generatedImageUri) : undefined
  }));

  const visualOutput = result.visualOutput ? {
    ...result.visualOutput,
    generatedImageUri: result.visualOutput.generatedImageUri ? resolveLocalImageUri(result.visualOutput.generatedImageUri) : undefined
  } : result.visualOutput;

  return {
    ...result,
    originalImageUri,
    generatedImageUri,
    suggestionGenerations,
    visualOutput
  };
}

function normalizeHistoryShape(result: any, index: number): AnalysisResult | undefined {
  if (!result || typeof result !== 'object') {
    return undefined;
  }

  const fallbackId =
    [result.sourceAnalysisId, result.analysisId, result.generatedImageUri, result.originalImageUri]
      .find((value): value is string => typeof value === 'string' && value.length > 0) ??
    `legacy-history:${index}`;

  const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
  const createdAt =
    typeof result.createdAt === 'string' && result.createdAt.length > 0
      ? result.createdAt
      : new Date(0).toISOString();

  return {
    ...result,
    analysisId: typeof result.analysisId === 'string' && result.analysisId.length > 0 ? result.analysisId : fallbackId,
    sourceAnalysisId:
      typeof result.sourceAnalysisId === 'string' && result.sourceAnalysisId.length > 0
        ? result.sourceAnalysisId
        : undefined,
    createdAt,
    suggestions
  };
}

export async function persistHistory(results: AnalysisResult[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(results.slice(0, HISTORY_LIMIT)));
}

async function normalizeLoadedHistory(results: AnalysisResult[]): Promise<AnalysisResult[]> {
  const normalized = results.flatMap((rawResult, index) => {
    const result = normalizeHistoryShape(rawResult, index);
    if (!result) {
      return [];
    }

    const generations = result.suggestionGenerations ?? [];
    if (generations.length <= 1) {
      return [result];
    }

    const sourceAnalysisId = result.sourceAnalysisId ?? result.analysisId;
    return generations.map(entry => {
      const historyResult: AnalysisResult = {
        ...result,
        analysisId: `${sourceAnalysisId}:generated:${entry.suggestionIndex}:${entry.generatedImageUri}`,
        sourceAnalysisId,
        selectedSuggestionIndex: entry.suggestionIndex,
        generatedImageUri: entry.generatedImageUri,
        suggestionGenerations: [entry],
        visualOutput: {
          type: 'generated_image',
          generatedImageUri: entry.generatedImageUri,
          generationStatus: 'completed'
        }
      };
      return historyResult;
    });
  }).slice(0, HISTORY_LIMIT);

  return Promise.all(normalized.map(persistHistoryResultImages));
}

async function persistHistoryResultImages(result: AnalysisResult): Promise<AnalysisResult> {
  const [originalImageUri, generatedImageUri] = await Promise.all([
    persistImageFile(result.originalImageUri, 'original-photo'),
    result.generatedImageUri ? persistImageFile(result.generatedImageUri, 'openai-edit') : Promise.resolve(undefined)
  ]);
  const suggestionGenerations = result.suggestionGenerations?.map(entry =>
    entry.generatedImageUri === result.generatedImageUri && generatedImageUri
      ? { ...entry, generatedImageUri }
      : entry
  );
  const visualOutput =
    result.visualOutput && result.visualOutput.generatedImageUri === result.generatedImageUri && generatedImageUri
      ? { ...result.visualOutput, generatedImageUri }
      : result.visualOutput;

  return {
    ...result,
    originalImageUri,
    generatedImageUri,
    suggestionGenerations,
    visualOutput
  };
}
