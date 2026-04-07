import { buildPhotoAnalysisPrompt } from './promptBuilder';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL ?? 'gpt-4.1-mini';

export function hasOpenAIKey(): boolean {
  return Boolean(OPENAI_API_KEY && OPENAI_API_KEY.trim().length > 0);
}

export async function analyzePhotoWithOpenAI(
  imageBase64: string,
  mimeType: string
): Promise<unknown> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY');
  }

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
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
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  return response.json();
}
