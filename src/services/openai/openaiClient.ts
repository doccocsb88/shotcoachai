import { buildPhotoAnalysisPrompt } from './promptBuilder';
import { logOpenAIAnalysisRequest, logOpenAIAnalysisResponse } from './debugOpenAIFlow';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL ?? 'gpt-4.1-mini';

export function hasOpenAIKey(): boolean {
  return Boolean(OPENAI_API_KEY && OPENAI_API_KEY.trim().length > 0);
}

export async function analyzePhotoWithOpenAI(
  imageBase64: string,
  mimeType: string,
  signal?: AbortSignal
): Promise<unknown> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY');
  }

  const requestBody = {
    model: OPENAI_MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: buildPhotoAnalysisPrompt()
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Analyze this photo and return JSON only.'
          },
          {
            type: 'input_image',
            image_url: `data:${mimeType};base64,${imageBase64}`
          }
        ]
      }
    ]
  };
  const startedAt = Date.now();

  logOpenAIAnalysisRequest({
    url: OPENAI_URL,
    model: OPENAI_MODEL,
    mimeType,
    imageBase64Length: imageBase64.length,
    body: requestBody
  });

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const body = await response.text();
    logOpenAIAnalysisResponse({
      status: response.status,
      ok: response.ok,
      elapsedMs: Date.now() - startedAt,
      outputText: body
    });
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const raw = await response.json();
  logOpenAIAnalysisResponse({
    status: response.status,
    ok: response.ok,
    elapsedMs: Date.now() - startedAt,
    outputText: extractOutputTextForDebug(raw)
  });

  return raw;
}

function extractOutputTextForDebug(raw: unknown): string | undefined {
  const typed = raw as {
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  return typed.output
    ?.flatMap(item => item.content ?? [])
    .find(content => content.type === 'output_text' && typeof content.text === 'string')
    ?.text;
}
