import AsyncStorage from '@react-native-async-storage/async-storage';

import { AnalysisResult } from '../../models/analysis';

const HISTORY_KEY = '@shotcoach/history';
const HISTORY_LIMIT = 20;

export async function loadHistory(): Promise<AnalysisResult[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function persistHistory(results: AnalysisResult[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(results.slice(0, HISTORY_LIMIT)));
}
