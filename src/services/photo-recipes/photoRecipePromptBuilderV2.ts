import { PhotoRecipe } from '../../models/photoRecipe';
import { buildParameterTranslation } from './recipeTranslatorV2';

export function buildPhotoRecipePromptV2(recipe: PhotoRecipe): string {
  const translation = buildParameterTranslation(recipe);
  
  const recipeName = recipe.name || recipe.title || 'Unknown Recipe';
  
  return `Selected flow: Photo Recipes.

Edit the uploaded photo using the selected Photo Recipe: ${recipeName}.

The uploaded image is the source of truth.

Task:

Apply a realistic Fujifilm-style color grade only.

Treat this edit as if the image had originally been captured using the following Fujifilm recipe settings.

Do not reconstruct, repaint, regenerate, retouch, or reinterpret image content.

Preserve the original photograph completely.

Preservation Priority:

1. Preserve identity.
2. Preserve clothing.
3. Preserve hairstyle and accessories.
4. Preserve body shape and facial features.
5. Preserve pose.
6. Preserve camera angle and perspective.
7. Preserve environment and composition.
8. Apply only the recipe rendering.

Fujifilm Recipe:

Film Simulation:
${recipe.filmSimulation || 'Standard'}

White Balance:
${recipe.whiteBalance ? recipe.whiteBalance.mode : 'Auto'}

WB Shift:
Red ${recipe.whiteBalance ? recipe.whiteBalance.redShift : 0}
Blue ${recipe.whiteBalance ? recipe.whiteBalance.blueShift : 0}

Color Chrome Effect:
${recipe.colorChromeEffect || 'Off'}

Color Chrome FX Blue:
${recipe.colorChromeFXBlue || 'Off'}

Dynamic Range:
${recipe.dynamicRange || 'DR100'}

Highlight:
${recipe.highlight ?? 0}

Shadow:
${recipe.shadow ?? 0}

Color:
${recipe.color ?? 0 > 0 ? '+' : ''}${recipe.color ?? 0}

Sharpness:
${recipe.sharpness ?? 0 > 0 ? '+' : ''}${recipe.sharpness ?? 0}

High ISO Noise Reduction:
${recipe.noiseReduction ?? 0}

Clarity:
${recipe.clarity ?? 0}

Grain:
${recipe.grain && recipe.grain.enabled ? recipe.grain.strength + ' ' + recipe.grain.size : 'Off'}

Parameter Translation:

${translation}

Allowed:

- Color grading
- Tonal adjustment
- Highlight recovery
- Shadow balancing
- Color separation
- Dynamic range adjustment
- Mild sharpness tuning

Not Allowed:

- Change identity
- Change face
- Change body shape
- Change clothing
- Change hairstyle
- Change pose
- Change crop
- Change framing
- Change perspective
- Change environment
- Add or remove objects
- Change weather
- Change time of day
- Beauty retouching
- Skin smoothing
- Makeup effects
- HDR effects
- Cinematic relighting
- Artificial sun rays
- Anime
- Illustration
- CGI

Recipe-specific Restrictions:

Do not create:
- Teal-orange grading
- Travel influencer look
- HDR landscape look
- Modern digital color science
- Vibrant tropical colors
- Heavy blue enhancement

Output:

Return the exact same photograph rendered as if it had originally been captured using the ${recipeName} Fujifilm recipe settings above.
`.trim();
}
