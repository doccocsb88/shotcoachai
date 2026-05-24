import {
  buildCreativeDirectionPrompt,
  buildPromptComposerPrompt,
  buildQualityEvaluationPrompt,
  buildVisionAnalysisPrompt
} from './promptBuilder';
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
  return runOpenAIJsonStage({
    stage: 'vision-analysis',
    systemPrompt: buildVisionAnalysisPrompt(),
    userText: 'Analyze this photo and return the PhotoAnalysis JSON only.',
    imageBase64,
    mimeType,
    signal
  });
}

export async function createCreativeDirectionsWithOpenAI(
  photoAnalysisJson: unknown,
  imageBase64: string,
  mimeType: string,
  signal?: AbortSignal
): Promise<unknown> {
  return runOpenAIJsonStage({
    stage: 'creative-directions',
    systemPrompt: buildCreativeDirectionPrompt(),
    userText: `Create creative directions for this PhotoAnalysis JSON:\n${JSON.stringify(photoAnalysisJson)}`,
    imageBase64,
    mimeType,
    signal
  });
}

export async function composeGenerationRecipesWithOpenAI(
  photoAnalysisJson: unknown,
  creativeDirectionsJson: unknown,
  signal?: AbortSignal
): Promise<unknown> {
  return runOpenAIJsonStage({
    stage: 'prompt-composer',
    systemPrompt: buildPromptComposerPrompt(),
    userText:
      `Compose generation recipes for this PhotoAnalysis JSON:\n${JSON.stringify(photoAnalysisJson)}\n\n` +
      `CreativeDirection JSON:\n${JSON.stringify(creativeDirectionsJson)}`,
    signal
  });
}

export async function evaluateGeneratedImageWithOpenAI(
  originalImageBase64: string,
  generatedImageBase64: string,
  originalMimeType: string,
  generatedMimeType: string,
  selectedDirection: unknown,
  signal?: AbortSignal
): Promise<unknown> {
  return runOpenAIJsonStage({
    stage: 'quality-evaluation',
    systemPrompt: buildQualityEvaluationPrompt(),
    userText: `Evaluate the generated edit against the original photo and selected direction:\n${JSON.stringify(selectedDirection)}`,
    images: [
      { base64: originalImageBase64, mimeType: originalMimeType },
      { base64: generatedImageBase64, mimeType: generatedMimeType }
    ],
    signal
  });
}

async function runOpenAIJsonStage(input: {
  stage: string;
  systemPrompt: string;
  userText: string;
  imageBase64?: string;
  mimeType?: string;
  images?: Array<{ base64: string; mimeType: string }>;
  signal?: AbortSignal;
}): Promise<unknown> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY');
  }

  const userContent: Array<{ type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }> = [
    {
      type: 'input_text',
      text: input.userText
    }
  ];

  const images = input.images ?? (
    input.imageBase64 && input.mimeType ? [{ base64: input.imageBase64, mimeType: input.mimeType }] : []
  );

  images.forEach(image => {
    userContent.push({
      type: 'input_image',
      image_url: `data:${image.mimeType};base64,${image.base64}`
    });
  });

  const requestBody = {
    model: OPENAI_MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: input.systemPrompt
          }
        ]
      },
      {
        role: 'user',
        content: userContent
      }
    ]
  };
  const startedAt = Date.now();

  logOpenAIAnalysisRequest({
    url: OPENAI_URL,
    model: `${OPENAI_MODEL}:${input.stage}`,
    mimeType: input.mimeType ?? input.images?.map(image => image.mimeType).join(', ') ?? 'application/json',
    imageBase64Length:
      input.imageBase64?.length ?? input.images?.reduce((sum, image) => sum + image.base64.length, 0) ?? 0,
    body: requestBody
  });

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    signal: input.signal,
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
    throw new Error(`OpenAI ${input.stage} request failed: ${response.status} ${body}`);
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
