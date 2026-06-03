export type PhotoAiToolId =
  | 'ai_coach'
  | 'enhance_photo'
  | 'light_color'
  | 'restore_color'
  | 'upscale'
  | 'background_boost'
  | 'replace_background'
  | 'remove_object'
  | 'expand_frame'
  | 'smooth_skin';

export type PhotoAiToolCategory = 'recommended' | 'portrait' | 'lighting' | 'background' | 'advanced';

export interface PhotoAiTool {
  id: PhotoAiToolId;
  category: PhotoAiToolCategory;
  title: string;
  shortTitle: string;
  subtitle: string;
  detail: string;
  cta: string;
  badge?: string;
  promptFocus: string;
  quickSuggestions?: string[];
  instructionPlaceholder?: string;
}

export const DEFAULT_PHOTO_AI_TOOL_ID: PhotoAiToolId = 'ai_coach';

export const PHOTO_AI_TOOLS: PhotoAiTool[] = [
  {
    id: 'ai_coach',
    category: 'recommended',
    title: 'AI Coach',
    shortTitle: 'Coach',
    subtitle: 'Pose, framing, lighting advice',
    detail: 'Get ShotCoach guidance for pose, framing, lighting, and three practical preview directions.',
    cta: 'Analyze with AI Coach',
    badge: 'Classic',
    promptFocus: 'Run the existing conservative ShotCoach photo analysis and reference improvement flow.',
    quickSuggestions: ['Better pose', 'Improve framing', 'Lighting advice']
  },
  {
    id: 'enhance_photo',
    category: 'recommended',
    title: 'Enhance Photo',
    shortTitle: 'Enhance',
    subtitle: 'Make the photo look professional',
    detail: 'Improve clarity, exposure, detail, and natural polish while preserving identity and the original scene.',
    cta: 'Enhance Photo',
    promptFocus: 'Create professional, realistic photo enhancement directions: improve sharpness, exposure, detail, and natural quality without changing identity, pose, outfit, or background.',
    quickSuggestions: ['Professional look', 'Natural detail', 'Sharper photo'],
    instructionPlaceholder: 'Describe the style you want, such as natural portrait, product polish, or clearer detail...'
  },
  {
    id: 'light_color',
    category: 'lighting',
    title: 'Light & Color',
    shortTitle: 'Light',
    subtitle: 'Balance exposure and tone',
    detail: 'Fix dark areas, contrast, white balance, and color harmony without making the edit look artificial.',
    cta: 'Fix Light & Color',
    promptFocus: 'Focus on exposure, shadow recovery, contrast, white balance, skin tone accuracy, and subtle color harmony. Preserve the original scene and mood.',
    quickSuggestions: ['Brighten shadows', 'Fix white balance', 'Warmer tone'],
    instructionPlaceholder: 'Describe the lighting or color issue you want to fix...'
  },
  {
    id: 'restore_color',
    category: 'lighting',
    title: 'Restore Color',
    shortTitle: 'Color',
    subtitle: 'Revive faded colors naturally',
    detail: 'Bring back saturation and color depth for flat or washed-out photos while keeping natural skin tones.',
    cta: 'Restore Color',
    promptFocus: 'Restore faded color in a natural way: improve saturation, color separation, and skin tone realism without heavy grading or fantasy colors.',
    quickSuggestions: ['More vibrant', 'Natural skin tone', 'Restore faded color'],
    instructionPlaceholder: 'Describe which colors should feel fresher or more natural...'
  },
  {
    id: 'upscale',
    category: 'advanced',
    title: 'Upscale 2K/4K',
    shortTitle: 'Upscale',
    subtitle: 'Recover detail and sharpness',
    detail: 'Generate directions that prioritize crisp detail, clarity, and low-noise restoration for blurry photos.',
    cta: 'Upscale Photo',
    promptFocus: 'Prioritize image detail recovery, clarity, texture preservation, low-noise sharpening, and realistic high-resolution restoration. Do not change composition or identity.',
    quickSuggestions: ['Sharper face', 'Reduce blur', 'More detail'],
    instructionPlaceholder: 'Describe what should become clearer, such as face, product, text, or background detail...'
  },
  {
    id: 'background_boost',
    category: 'background',
    title: 'Background Boost',
    shortTitle: 'Backdrop',
    subtitle: 'Improve scenery and depth',
    detail: 'Make the existing background cleaner, deeper, and more attractive while keeping the subject unchanged.',
    cta: 'Boost Background',
    promptFocus: 'Improve the existing background only: increase depth, environmental detail, and natural separation. Do not replace the location or change the subject.',
    quickSuggestions: ['More depth', 'Cleaner background', 'Better scenery'],
    instructionPlaceholder: 'Describe how the existing background should be improved...'
  },
  {
    id: 'replace_background',
    category: 'background',
    title: 'Replace Background',
    shortTitle: 'Replace',
    subtitle: 'Move subject into a new scene',
    detail: 'Create a realistic new background concept while preserving the subject, face, outfit, and pose.',
    cta: 'Replace Background',
    promptFocus: 'Replace the background with a realistic, natural new setting while preserving the exact subject identity, face, outfit, pose, lighting integration, and perspective.',
    quickSuggestions: ['Studio background', 'Beach sunset', 'City street'],
    instructionPlaceholder: 'Describe the new background you want...'
  },
  {
    id: 'remove_object',
    category: 'advanced',
    title: 'Remove Object',
    shortTitle: 'Remove',
    subtitle: 'Clean distracting items',
    detail: 'Remove visible distractions and reconstruct the surrounding background naturally.',
    cta: 'Remove Objects',
    promptFocus: 'Remove distracting or unwanted visible objects where appropriate and reconstruct the background naturally with matching texture, lighting, and perspective.',
    quickSuggestions: ['People in background', 'Trash can', 'Power lines', 'Cars', 'Other object'],
    instructionPlaceholder: 'Describe what you want to remove...'
  },
  {
    id: 'expand_frame',
    category: 'advanced',
    title: 'Expand Frame',
    shortTitle: 'Expand',
    subtitle: 'Create more space around subject',
    detail: 'Extend the image edges with natural scenery and matching perspective for more flexible crops.',
    cta: 'Expand Frame',
    promptFocus: 'Create outpaint-style expansion directions: extend the frame naturally around the existing image, preserving subject placement, perspective, lighting, and scene continuity.',
    quickSuggestions: ['Expand left and right', 'More sky', 'More room around subject'],
    instructionPlaceholder: 'Describe which sides to expand or what extra space you need...'
  },
  {
    id: 'smooth_skin',
    category: 'portrait',
    title: 'Smooth Skin',
    shortTitle: 'Skin',
    subtitle: 'Natural portrait retouch',
    detail: 'Suggest light, natural, or studio-level skin smoothing while keeping facial details realistic.',
    cta: 'Smooth Skin',
    promptFocus: 'Focus on natural portrait retouching: smooth skin texture gently, reduce minor blemishes, preserve pores, facial structure, identity, hair detail, and realistic skin tone.',
    quickSuggestions: ['Light touch', 'Natural skin', 'Studio retouch'],
    instructionPlaceholder: 'Describe the retouch strength you want...'
  }
];

export const PHOTO_AI_TOOL_CATEGORIES: Array<{ id: PhotoAiToolCategory; title: string }> = [
  { id: 'recommended', title: 'Recommended' },
  { id: 'portrait', title: 'Portrait' },
  { id: 'lighting', title: 'Lighting' },
  { id: 'background', title: 'Background' },
  { id: 'advanced', title: 'Advanced' }
];

export function getPhotoAiTool(id: PhotoAiToolId): PhotoAiTool {
  return PHOTO_AI_TOOLS.find(tool => tool.id === id) ?? PHOTO_AI_TOOLS[0];
}
