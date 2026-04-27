import { createMockAnalysisResult } from './mockAnalysis';

type TestingMockupMode = 'success' | 'error' | 'invalid_json' | 'timeout';

const DEFAULT_DELAY_MS = 900;
const DEFAULT_TIMEOUT_DELAY_MS = 45000;

export async function analyzePhotoWithTestingMockupApi(): Promise<unknown> {
  const mode = getTestingMockupMode();

  if (mode === 'timeout') {
    await wait(DEFAULT_TIMEOUT_DELAY_MS);
  } else {
    await wait(DEFAULT_DELAY_MS);
  }

  if (mode === 'error') {
    throw new Error('TestingMockup API simulated failure.');
  }

  if (mode === 'invalid_json') {
    return createOpenAITextResponse('{ invalid json');
  }

  // We extract the payload out of createMockAnalysisResult to simulate the JSON payload from the API
  const mockResult = createMockAnalysisResult('mockUri');
  const payload = {
    overall_assessment: mockResult.overallAssessment,
    suggestions: mockResult.suggestions
  };

  return createOpenAITextResponse(JSON.stringify(payload));
}

function getTestingMockupMode(): TestingMockupMode {
  const raw = process.env.EXPO_PUBLIC_TESTING_MOCKUP_MODE;
  if (raw === 'error' || raw === 'invalid_json' || raw === 'timeout') {
    return raw;
  }
  return 'success';
}

function createOpenAITextResponse(text: string) {
  return {
    output: [
      {
        content: [
          {
            type: 'output_text',
            text
          }
        ]
      }
    ]
  };
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
