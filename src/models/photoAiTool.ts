export type PhotoAiToolId =
  | 'ai_coach'
  | 'enhance_photo'
  | 'better_composition'
  | 'light_color'
  | 'restore_color'
  | 'upscale'
  | 'background_boost'
  | 'replace_background'
  | 'remove_object'
  | 'expand_frame'
  | 'smooth_skin'
  | 'photo_recipe';

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
  quickSuggestionInstructions?: Record<string, string>;
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
    promptFocus: 'Preserve the exact same photograph while applying only minimal quality improvements: very minor exposure, shadow, highlight, noise, cleanup, and overall quality correction without changing crop, pose, face, skin, background, lighting style, color grading, or depth of field.',
    quickSuggestions: ['Professional look', 'Natural detail', 'Sharper photo'],
    quickSuggestionInstructions: {
      'Professional look': 'Apply only minimal professional cleanup. Preserve the exact same photograph, crop, identity, pose, background, lighting direction, white balance, and color temperature.',
      'Natural detail': 'Apply mild overall quality improvement and minor cleanup only. Do not retouch skin, beautify, recompose, recolor, relight, or change depth of field.',
      'Sharper photo': 'Apply mild noise reduction and very conservative sharpening only. Do not change the person, face, pose, outfit, background, crop, lighting, or color grading.'
    },
    instructionPlaceholder: 'Describe the style you want, such as natural portrait, product polish, or clearer detail...'
  },
  {
    id: 'better_composition',
    category: 'recommended',
    title: 'Better Composition',
    shortTitle: 'Compose',
    subtitle: 'Improve framing and balance',
    detail: 'Recompose the photo with better framing, balance, and subject placement while preserving the original scene.',
    cta: 'Improve Composition',
    promptFocus: 'Improve framing, balance, and subject placement for a stronger, more professional composition while preserving the original scene, identity, lighting, and realism.',
    quickSuggestions: [
      'Rule of Thirds',
      'Symmetrical',
      'Subject Focus',
      'Centered Portrait',
      'Cinematic Framing',
      'Social Media Ready',
      'Travel Photography',
      'Professional Portrait'
    ],
    quickSuggestionInstructions: {
      'Rule of Thirds': 'Reframe the photo using classic rule-of-thirds composition.',
      Symmetrical: 'Create a clean and balanced composition with visual symmetry.',
      'Subject Focus': 'Emphasize the main subject and reduce visual distractions.',
      'Centered Portrait': 'Place the subject centrally for a strong portrait look.',
      'Cinematic Framing': 'Create a more dramatic and visually engaging composition.',
      'Social Media Ready': 'Optimize framing for modern social media content.',
      'Travel Photography': 'Balance the subject and scenery for a travel-style photo.',
      'Professional Portrait': 'Improve composition for a polished portrait appearance.'
    },
    instructionPlaceholder: "Describe the composition you'd like to achieve..."
  },
  {
    id: 'light_color',
    category: 'lighting',
    title: 'Light & Color',
    shortTitle: 'Light',
    subtitle: 'Balance exposure and tone',
    detail: 'Fix dark areas, contrast, white balance, and color harmony without making the edit look artificial.',
    cta: 'Fix Light & Color',
    promptFocus: 'Improve exposure, tonal balance, white balance, and color accuracy while preserving the same photograph, identity, pose, framing, crop, composition, camera angle, clothing, background, weather, and scene.',
    quickSuggestions: ['Brighten shadows', 'Fix white balance', 'Warmer tone'],
    quickSuggestionInstructions: {
      'Brighten shadows': 'Recover shadows naturally while preserving the same photograph, pose, framing, crop, camera angle, background, lighting direction, and color accuracy.',
      'Fix white balance': 'Correct white balance and natural color balance only. Preserve identity, skin tone accuracy, clothing, background, scene composition, and camera perspective.',
      'Warmer tone': 'Apply only a subtle natural warmth adjustment. Do not add filters, cinematic lighting, dramatic relighting, artificial bokeh, beauty retouching, or change the scene.'
    },
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
    detail: 'Conservatively improve perceived resolution, softness, compression artifacts, and noise while preserving the exact same image.',
    cta: 'Upscale Photo',
    promptFocus: 'Increase perceived resolution and clean up compression or softness while preserving the exact same image. Do not change crop, pose, camera angle, composition, face, skin, hair, clothing, background, lighting, color grading, or invent missing facial details.',
    quickSuggestions: ['Sharper face', 'Reduce blur', 'More detail'],
    quickSuggestionInstructions: {
      'Sharper face': 'Apply mild conservative sharpening only. Do not reconstruct the face, invent missing facial details, enhance eyes, teeth, skin, or hair beyond the original, or change identity.',
      'Reduce blur': 'Apply mild deblurring and compression cleanup only. Preserve the same crop, pose, camera angle, face, clothing, background, lighting, and color grading.',
      'More detail': 'Improve perceived resolution and natural texture preservation conservatively. Do not add new details, change facial features, beautify, smooth skin, or alter the scene.'
    },
    instructionPlaceholder: 'Describe what should become clearer, such as face, product, text, or background detail...'
  },
  {
    id: 'background_boost',
    category: 'background',
    title: 'Background Boost',
    shortTitle: 'Backdrop',
    subtitle: 'Clean up background balance',
    detail: 'Subtly clean and balance the existing background while preserving the same person, scene, composition, lighting, and camera perspective.',
    cta: 'Boost Background',
    promptFocus: 'Improve the existing background subtly with mild cleanup, clarity, noise reduction, shadow/highlight balance, color harmony, and subject-background separation. Do not replace the background, change location, add objects, remove important objects, change crop, pose, camera angle, subject, lighting, weather, or scene mood.',
    quickSuggestions: ['Cleaner background', 'Background balance', 'Subtle separation'],
    quickSuggestionInstructions: {
      'Cleaner background': 'Apply mild background cleanup only. Preserve the same background location, objects, scene, crop, camera angle, subject, lighting direction, weather, and color temperature.',
      'Background balance': 'Balance background shadows, highlights, noise, and color harmony subtly. Do not replace the background, add objects, remove important objects, or change the environment.',
      'Subtle separation': 'Add only subtle subject-background separation that already fits the original photo. Do not add artificial bokeh, cinematic lighting, dramatic grading, or make the subject look cut out.'
    },
    instructionPlaceholder: 'Describe how the existing background should be improved...'
  },
  {
    id: 'replace_background',
    category: 'background',
    title: 'Replace Background',
    shortTitle: 'Replace',
    subtitle: 'Move subject into a new scene',
    detail: 'Replace only the background with a realistic new setting while preserving the original subject unchanged.',
    cta: 'Replace Background',
    promptFocus: 'Replace only the background with a realistic natural new setting. Preserve the exact same subject, identity, face, facial structure, expression, skin tone identity, hairstyle, body shape, pose, clothing, accessories, hair edges, and realistic anatomy.',
    quickSuggestions: ['Studio background', 'Beach sunset', 'City street'],
    quickSuggestionInstructions: {
      'Studio background': 'Replace only the background with a realistic simple studio setting. Preserve the same subject, face, pose, outfit, proportions, skin tone, hair, lighting logic, and edge realism.',
      'Beach sunset': 'Replace only the background with a realistic beach sunset scene. Keep the subject unchanged and match perspective, depth of field, shadow logic, white balance, and image grain naturally.',
      'City street': 'Replace only the background with a realistic city street setting. Do not change the subject, add extra people, apply cinematic relighting, heavy grading, beauty filters, or AI influencer styling.'
    },
    instructionPlaceholder: 'Describe the new background you want...'
  },
  {
    id: 'remove_object',
    category: 'advanced',
    title: 'Remove Object',
    shortTitle: 'Remove',
    subtitle: 'Clean distracting items',
    detail: 'Remove only the unwanted object and reconstruct the affected area naturally while preserving the same photo.',
    cta: 'Remove Objects',
    promptFocus: 'Remove only the unwanted object, then reconstruct the affected area using surrounding visual information. Preserve the exact same person, environment, background, perspective, composition, camera angle, crop, lighting, weather, depth of field, and all important scene elements.',
    quickSuggestions: ['People in background', 'Trash can', 'Power lines', 'Cars', 'Other object'],
    quickSuggestionInstructions: {
      'People in background': 'Remove only unwanted people in the background. Preserve the main subject, scene, lighting, perspective, crop, and all important objects.',
      'Trash can': 'Remove only the trash can and reconstruct the affected area with matching texture, shadows, blur, noise, and perspective.',
      'Power lines': 'Remove only distracting power lines where clearly separable. Preserve sky, buildings, trees, lighting, image grain, and scene continuity.',
      Cars: 'Remove only unwanted cars if they are clearly distracting. Reconstruct the background naturally and do not change the location, crop, lighting, or subject.',
      'Other object': 'Remove only the specified unwanted object. If unclear, make the smallest reasonable cleanup and keep the image mostly unchanged.'
    },
    instructionPlaceholder: 'Describe what you want to remove...'
  },
  {
    id: 'expand_frame',
    category: 'advanced',
    title: 'Expand Frame',
    shortTitle: 'Expand',
    subtitle: 'Create more space around subject',
    detail: 'Outpaint the edges naturally while keeping the original subject, scene, pose, lighting, perspective, and captured moment unchanged.',
    cta: 'Expand Frame',
    promptFocus: 'Expand the frame naturally around the original photo while preserving the same captured moment. Only extend the surrounding environment beyond the current image boundaries. Do not change pose, face, outfit, subject position, lighting, perspective, crop center, or original image content.',
    quickSuggestions: ['Expand left and right', 'More sky', 'More room around subject'],
    quickSuggestionInstructions: {
      'Expand left and right': 'Extend only the left and right outer areas naturally. Keep the original subject, pose, face, crop center, perspective, lighting, and scene unchanged.',
      'More sky': 'Extend the frame with more matching sky only where it naturally continues from the original. Do not change the location, lighting, subject, camera angle, or scene mood.',
      'More room around subject': 'Add surrounding space by outpainting the edges only. Preserve the exact same captured moment and keep the center/original subject visually unchanged.'
    },
    instructionPlaceholder: 'Describe which sides to expand or what extra space you need...'
  },
  {
    id: 'smooth_skin',
    category: 'portrait',
    title: 'Smooth Skin',
    shortTitle: 'Skin',
    subtitle: 'Natural portrait retouch',
    detail: 'Gently reduce temporary skin imperfections while preserving identity, facial structure, lighting, and natural texture.',
    cta: 'Smooth Skin',
    promptFocus: 'Improve only temporary skin imperfections while preserving the exact same person, facial structure, expression, age appearance, skin tone identity, hairstyle, clothing, background, lighting, pores, moles, freckles, and realistic skin texture.',
    quickSuggestions: ['Light Touch', 'Natural Skin', 'Under-eye Softening'],
    quickSuggestionInstructions: {
      'Light Touch': 'Reduce only small temporary blemishes and redness. Preserve nearly all pores, freckles, moles, facial structure, lighting, and natural skin texture.',
      'Natural Skin': 'Gently reduce temporary blemishes and uneven skin texture only. Do not beautify, reshape, relight, recolor, change skin tone, or smooth skin unnaturally.',
      'Under-eye Softening': 'Subtly refine under-eye shadows only if it still looks natural. Do not de-age, brighten the whole face, reshape features, add makeup, or change identity.'
    },
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
