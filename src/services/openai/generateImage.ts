import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

import { ImageQualityEvaluation } from '../../models/analysis';
import { PhotoAiToolId } from '../../models/photoAiTool';
import { fileToBase64 } from '../image/fileToBase64';
import { normalizeFileUri, persistImageFile } from '../image/persistentImage';
import { saveBase64ImageToCache } from '../image/saveBase64Image';
import { logOpenAIImageEditRequest, logOpenAIImageEditResponse, shouldDebugOpenAIFlow } from './debugOpenAIFlow';
import { evaluateGeneratedImageWithOpenAI } from './openaiClient';
import { normalizeImageQualityEvaluation, parseJsonResponse } from './responseParser';

const IMAGE_EDITS_URL = 'https://api.openai.com/v1/images/edits';

const ALLOWED_GPT_IMAGE_SIZES = new Set(['1024x1024', '1024x1536', '1536x1024']);

function resolveImageEditModel(): string {
  return (process.env.EXPO_PUBLIC_OPENAI_IMAGE_MODEL ?? 'gpt-image-1.5').trim();
}

function resolveImageEditSize(model: string): string {
  const requested = (process.env.EXPO_PUBLIC_OPENAI_IMAGE_SIZE ?? '1024x1536').trim();
  if (model === 'dall-e-2') {
    return '1024x1024';
  }
  if (ALLOWED_GPT_IMAGE_SIZES.has(requested)) {
    return requested;
  }
  return '1024x1536';
}

function resolveImageEditQuality(editingToolId?: PhotoAiToolId): string {
  const configuredQuality = process.env.EXPO_PUBLIC_OPENAI_IMAGE_EDIT_QUALITY?.trim();
  if (configuredQuality) {
    return configuredQuality;
  }
  return editingToolId === 'enhance_photo' || editingToolId === 'upscale' ? 'high' : 'medium';
}

function isDallE2(model: string): boolean {
  return model === 'dall-e-2';
}

function isGptImageFamily(model: string): boolean {
  return model.startsWith('gpt-image') || model === 'chatgpt-image-latest';
}

function assertModelSupportsImageEdit(model: string): void {
  if (model === 'dall-e-3' || model.startsWith('dall-e-3')) {
    throw new Error(
      'Image edit is not available for dall-e-3. Set EXPO_PUBLIC_OPENAI_IMAGE_MODEL to gpt-image-1.5, gpt-image-1, gpt-image-1-mini, or dall-e-2.'
    );
  }
  if (!isDallE2(model) && !isGptImageFamily(model)) {
    throw new Error(
      `Unsupported image edit model "${model}". Use a GPT Image model (e.g. gpt-image-1.5) or dall-e-2.`
    );
  }
}

function inferMimeTypeFromUri(imageUri: string): string {
  const lower = imageUri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

function resolveMimeType(imageUri: string, explicitMimeType?: string): string {
  const trimmed = explicitMimeType?.trim();
  if (trimmed && trimmed.includes('/')) {
    return trimmed;
  }
  return inferMimeTypeFromUri(imageUri);
}

function uploadFileNameForMime(mimeType: string): string {
  if (mimeType.includes('png')) return 'photo.png';
  if (mimeType.includes('webp')) return 'photo.webp';
  return 'photo.jpg';
}

function buildConservativeImageEditPrompt(userPrompt: string, editingToolId: PhotoAiToolId = 'ai_coach'): string {
  if (userPrompt.includes('Selected flow: Photo Recipes.')) {
    return userPrompt.trim();
  }

  if (
    editingToolId === 'ai_coach' ||
    editingToolId === 'enhance_photo' ||
    editingToolId === 'better_composition' ||
    editingToolId === 'light_color' ||
    editingToolId === 'restore_color' ||
    editingToolId === 'upscale' ||
    editingToolId === 'background_boost' ||
    editingToolId === 'expand_frame' ||
    editingToolId === 'replace_background' ||
    editingToolId === 'remove_object' ||
    editingToolId === 'smooth_skin'
  ) {
    return userPrompt.trim();
  }

  return `
Edit the uploaded photo as a realistic photography reference. The uploaded image is the source of truth.

Priority order:
1. Preserve the person's identity.
2. Preserve the original environment, lighting, time of day, weather, white balance, color temperature, and scene mood.
3. Improve only pose, framing, composition, camera angle, and subject separation.
4. Apply only subtle photographic cleanup that keeps the image realistic.

Preservation requirements:
- Preserve the exact same person and identity. Do not change the face, facial structure, eye shape, nose shape, jawline, age appearance, expression identity, skin tone identity, hairstyle, hair color, body shape, or gender presentation.
- Preserve the original clothing and accessories. Keep the same sweater/outfit, colors, patterns, jewelry, shoes, and visible garment details. Do not replace wardrobe.
- Preserve the original location and background. Do not move the person to a new train, building, street, room, landscape, sky, or fantasy/editorial set. Do not invent a different scene.
- Preserve the original lighting condition, time of day, weather, white balance, color temperature, contrast level, and scene mood. Do not relight or recolor the scene.
- Preserve the major composition context and visible objects from the original photo. Any crop/framing change must still look like the same captured moment.
- Preserve realistic human anatomy, hands, eyes, and facial details.

Allowed edits:
- Improve pose, framing, crop, camera angle feel, subject placement, subject separation, local sharpness, and natural depth of field.
- Apply only minor exposure correction or shadow recovery if needed, while keeping the same lighting source and color temperature.
- Keep skin texture natural. Do not smooth skin into a synthetic beauty look.
- Make small pose/expression refinements only when they remain consistent with the original body position.

Not allowed:
- Do not beautify or redesign the face.
- Do not create an influencer-style AI face.
- Do not apply cinematic relighting, dramatic shadows, orange/teal grading, golden hour conversion, fantasy atmosphere, or editorial fashion styling.
- Do not change weather, time of day, background, outfit, body shape, hairstyle, or accessories.
- If the requested direction contains cinematic, luxury, dramatic, beauty, perfect skin, heavy color grading, or fantasy wording, ignore those parts and keep Reference Mode realism.

Requested direction:
${userPrompt}

Final output must look like the same captured moment with improved photographic choices, not a new photo shoot or a new generated scene.
`.trim();
}

async function persistRemoteImageToCache(imageUrl: string): Promise<string> {
  const dest = `${FileSystem.cacheDirectory}openai-edit-${Date.now()}.png`;
  const result = await FileSystem.downloadAsync(imageUrl, dest);
  if (result.status !== 200) {
    throw new Error(`Failed to download edited image (HTTP ${result.status}).`);
  }
  return persistImageFile(result.uri, 'openai-edit');
}

export async function generateEditedImage(
  prompt: string,
  originalImageUri: string,
  originalImageMimeType?: string,
  editingToolId?: PhotoAiToolId
): Promise<string> {
  const provider = process.env.EXPO_PUBLIC_ANALYSIS_PROVIDER;
  if (provider === 'mock' || provider === 'testing_mockup') {
    return new Promise(resolve => setTimeout(() => resolve('mock_generated_uri'), 2000));
  }

  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY');
  }

  const model = resolveImageEditModel();
  assertModelSupportsImageEdit(model);

  const size = resolveImageEditSize(model);
  const fileUri = normalizeFileUri(originalImageUri);
  const editPrompt = buildConservativeImageEditPrompt(prompt, editingToolId);

  // OpenAI strictly requires PNG format for image edits.
  // Convert the image to PNG format to prevent "Invalid image file or mode" errors.
  const processedImage = await ImageManipulator.manipulateAsync(
    fileUri,
    [],
    { format: ImageManipulator.SaveFormat.PNG }
  );
  
  const finalFileUri = normalizeFileUri(processedImage.uri);
  const finalMimeType = 'image/png';

  const form = new FormData();
  form.append('model', model);
  form.append('prompt', editPrompt);
  form.append('size', size);
  form.append(
    'image',
    // React Native FormData accepts a local file descriptor here (not a web File).
    { uri: finalFileUri, type: finalMimeType, name: 'photo.png' } as unknown as Blob
  );

  if (isGptImageFamily(model)) {
    form.append('quality', resolveImageEditQuality(editingToolId));
    form.append('output_format', 'png');
    form.append('input_fidelity', 'high');
  }

  if (isDallE2(model)) {
    form.append('response_format', 'b64_json');
  }

  const startedAt = Date.now();

  if (shouldDebugOpenAIFlow()) {
    logOpenAIImageEditRequest({
      url: IMAGE_EDITS_URL,
      model,
      size,
      quality: isGptImageFamily(model) ? resolveImageEditQuality(editingToolId) : undefined,
      outputFormat: isGptImageFamily(model) ? 'png' : undefined,
      imageUri: finalFileUri,
      mimeType: finalMimeType,
      prompt: editPrompt
    });
  }

  const response = await fetch(IMAGE_EDITS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: form
  });

  const responseText = await response.text();
  let data: { data?: Array<{ b64_json?: string; url?: string }> };
  try {
    data = JSON.parse(responseText) as { data?: Array<{ b64_json?: string; url?: string }> };
  } catch {
    data = {};
  }

  const b64 = data.data?.[0]?.b64_json;
  const remoteUrl = data.data?.[0]?.url;

  if (shouldDebugOpenAIFlow()) {
    logOpenAIImageEditResponse({
      status: response.status,
      ok: response.ok,
      elapsedMs: Date.now() - startedAt,
      generatedBase64Length: b64?.length,
      revisedPrompt: undefined
    });
    if (!response.ok) {
      console.error('[ShotCoach][OpenAI] 400 ERROR RESPONSE:', responseText);
    }
  }

  if (!response.ok) {
    const message =
      (data as { error?: { message?: string } }).error?.message ?? responseText.slice(0, 500);
    throw new Error(`Failed to edit image: ${response.status} ${message}`);
  }

  if (b64) {
    return saveBase64ImageToCache(b64);
  }

  if (remoteUrl) {
    return persistRemoteImageToCache(remoteUrl);
  }

  throw new Error('No image returned from image edit API');
}

export async function evaluateEditedImageQuality(input: {
  originalImageUri: string;
  generatedImageUri: string;
  originalImageMimeType?: string;
  selectedDirection: unknown;
}): Promise<ImageQualityEvaluation | undefined> {
  const provider = process.env.EXPO_PUBLIC_ANALYSIS_PROVIDER;
  if (provider === 'mock' || provider === 'testing_mockup') {
    return {
      identity_preservation: 9,
      naturalness: 8,
      anatomy_score: 9,
      overall_score: 8,
      retry_required: false,
      retry_reason: '',
      recommended_action: 'accept'
    };
  }

  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return undefined;
  }

  const generatedMimeType = resolveMimeType(input.generatedImageUri, 'image/png');
  const [originalImageBase64, generatedImageBase64] = await Promise.all([
    fileToBase64(normalizeFileUri(input.originalImageUri)),
    fileToBase64(normalizeFileUri(input.generatedImageUri))
  ]);
  const raw = await evaluateGeneratedImageWithOpenAI(
    originalImageBase64,
    generatedImageBase64,
    resolveMimeType(input.originalImageUri, input.originalImageMimeType),
    generatedMimeType,
    input.selectedDirection
  );

  return normalizeImageQualityEvaluation(parseJsonResponse(raw));
}
