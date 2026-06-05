import { PhotoRecipe } from '../../models/photoRecipe';
import { translateRecipeParameters } from './recipeTranslator';

const GLOBAL_NEGATIVE_PROMPT = [
  'Avoid HDR.',
  'Avoid oversaturation.',
  'Avoid plastic skin.',
  'Avoid AI beauty filters.',
  'Avoid changing age.',
  'Avoid changing ethnicity.',
  'Avoid changing facial structure.',
  'Avoid changing body proportions.',
  'Avoid fantasy elements.',
  'Avoid replacing objects.',
  'Avoid changing weather dramatically.',
  'Avoid changing time of day dramatically.'
];

export function buildPhotoRecipePrompt(recipe: PhotoRecipe): string {
  const visualIntent = translateRecipeParameters(recipe.recipeParameters);

  return `
Edit the uploaded photo using the selected Photo Recipe.

Selected flow: Photo Recipes.
Selected recipe: ${recipe.title}.

The uploaded image is the source of truth.

Goal:
Apply the selected photography recipe look through realistic color, tone, grain, contrast, and mood adjustments only.
The result must remain a practical photo reference that the user could realistically shoot again.

Priority order:
1. Preserve identity.
2. Preserve clothing.
3. Preserve hairstyle and accessories.
4. Preserve body shape and facial features.
5. Preserve pose.
6. Preserve camera angle and perspective.
7. Preserve environment, background layout, scene geometry, and composition.
8. Apply only the recipe look.

Recipe layer:
- Recipe name: ${recipe.title}.
- Mood: ${recipe.promptPreset.mood}
- Color palette: ${recipe.promptPreset.colorPalette}
- Lighting: ${recipe.promptPreset.lighting}
- Contrast: ${recipe.promptPreset.contrast}
- Saturation: ${recipe.promptPreset.saturation}
- Grain: ${recipe.promptPreset.grainDescription}
- Film simulation reference: ${recipe.recipeParameters.filmSimulation}
- Dynamic range: ${recipe.recipeParameters.dynamicRange}
- White balance: ${recipe.recipeParameters.whiteBalance}

Translated visual intent:
- Highlight intent: ${visualIntent.highlightIntent}
- Shadow intent: ${visualIntent.shadowIntent}
- Color intent: ${visualIntent.colorIntent}
- Sharpness intent: ${visualIntent.sharpnessIntent}
- Clarity intent: ${visualIntent.clarityIntent}

Strict preservation rules:
- Preserve the exact same person and identity.
- Preserve the same face, facial structure, expression, age appearance, skin tone identity, hairstyle, body shape, and realistic anatomy.
- Preserve the same clothing, accessories, colors, patterns, and visible garment details.
- Preserve the same pose, framing, crop, camera angle, perspective, and composition.
- Preserve the same background layout, objects, location, scene geometry, and environment.
- Preserve the original scene mood unless the recipe only subtly shifts color and tone.

Allowed adjustments:
- Realistic tonal adjustment.
- Natural color palette shift based on the selected recipe.
- Highlight and shadow tuning based on the translated visual intent.
- Subtle film-like grain if requested by the recipe.
- Mild natural sharpness or clarity adjustment based on the recipe.
- Subtle white balance shift based on the recipe while keeping skin tones believable.

Not allowed:
- Do not change the subject.
- Do not change identity, face, body shape, pose, outfit, hairstyle, or accessories.
- Do not replace the background.
- Do not add or remove objects.
- Do not change composition, crop, camera angle, or perspective.
- Do not create fantasy elements.
- Do not create an AI-generated portrait look.
- Do not apply beauty retouching, makeup, plastic skin, or influencer styling.
- Do not change weather or time of day dramatically.
- Do not convert the image into anime, illustration, cartoon, painting, or CGI.

Recipe-specific negative prompt:
${recipe.promptPreset.negativePrompt}

Global negative prompt:
${GLOBAL_NEGATIVE_PROMPT.join('\n')}

Output:
Return a realistic high-quality photo edit that looks like the same original photo with only the selected Photo Recipe look applied.
`.trim();
}
