import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_PROCESSING_CONSENT_KEY = '@shotcoach/ai_processing_consent';

export async function getAiProcessingConsent(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(AI_PROCESSING_CONSENT_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function setAiProcessingConsent(): Promise<void> {
  await AsyncStorage.setItem(AI_PROCESSING_CONSENT_KEY, '1');
}
