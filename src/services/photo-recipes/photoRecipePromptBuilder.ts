import { PhotoRecipe } from '../../models/photoRecipe';
import { translateRecipeParameters } from './recipeTranslator';

export function buildPhotoRecipePrompt(recipe: PhotoRecipe): string {
  const visualIntent = translateRecipeParameters(recipe.recipeParameters);

  return `
Selected flow: Photo Recipes.

Edit the uploaded photo using the selected Photo Recipe: ${recipe.title}.

The uploaded image is the source of truth.

Task:
Apply a non-destructive realistic photo color grade only.
Do not reconstruct, repaint, regenerate, retouch, or reinterpret the image content.

Preservation priority:
1. Preserve the exact same person, identity, face, age appearance, skin tone identity, body shape, pose, hairstyle, clothing, and accessories.
2. Preserve the exact same camera angle, perspective, crop, framing, and composition.
3. Preserve the exact same background layout, objects, location, weather, time of day, and scene geometry.
4. Apply only the selected recipe look through color, tone, contrast, grain, and mood.

Recipe:
- Name: ${recipe.title}
- Film simulation reference: ${recipe.recipeParameters.filmSimulation}
- Mood: ${recipe.promptPreset.mood}
- Palette: ${recipe.promptPreset.colorPalette}
- Lighting: ${recipe.promptPreset.lighting}
- Contrast: ${recipe.promptPreset.contrast}
- Saturation: ${recipe.promptPreset.saturation}
- Grain: ${recipe.promptPreset.grainDescription}
- White balance: ${recipe.recipeParameters.whiteBalance}
- Dynamic range: ${recipe.recipeParameters.dynamicRange}

Recipe strength:
Subtle to medium, around 35–45%.
Skin tone protection: high.
Geometry preservation: absolute.

Allowed:
- ${visualIntent.highlightIntent}
- ${visualIntent.shadowIntent}
- ${visualIntent.colorIntent}
- ${visualIntent.sharpnessIntent}
- ${visualIntent.clarityIntent}
- Realistic color palette shift based on the recipe
- Fine film-like grain if requested

Not allowed:
- Do not change identity, face, body, pose, outfit, hairstyle, accessories, background, objects, crop, perspective, weather, or time of day.
- Do not add new water, sky, clouds, objects, people, sunlight, or fantasy elements.
- Do not apply beauty retouching, makeup, plastic skin, HDR, heavy teal grading, fake tropical colors, over-saturation, cyberpunk colors, anime, illustration, painting, or CGI.
- ${recipe.promptPreset.negativePrompt}

Output:
Return the same original photo with only a realistic ${recipe.title} recipe color grade applied.
`.trim();
}
