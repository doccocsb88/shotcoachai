import { RecipeParameters, RecipeVisualIntent } from '../../models/photoRecipe';

export function translateRecipeParameters(parameters: RecipeParameters): RecipeVisualIntent {
  return {
    highlightIntent: translateHighlight(parameters.highlight),
    shadowIntent: translateShadow(parameters.shadow),
    colorIntent: translateColor(parameters.color),
    sharpnessIntent: translateSharpness(parameters.sharpness),
    clarityIntent: translateClarity(parameters.clarity)
  };
}

function translateHighlight(value: number): string {
  if (value <= -2) return 'Recover bright area details, reduce highlight clipping, and preserve sky texture.';
  if (value === -1) return 'Use slightly softer highlights while maintaining cloud and bright-area detail.';
  if (value === 1) return 'Use gently brighter highlights without clipping.';
  if (value >= 2) return 'Create luminous bright areas while preserving realistic highlight detail.';
  return 'Keep neutral highlight rendering.';
}

function translateShadow(value: number): string {
  if (value <= -2) return 'Use deeper shadows and stronger contrast while preserving important detail.';
  if (value === -1) return 'Use slightly deeper shadows with natural depth.';
  if (value === 1) return 'Lift dark regions slightly while maintaining depth.';
  if (value >= 2) return 'Reveal shadow detail while maintaining depth and realism.';
  return 'Keep neutral shadow rendering.';
}

function translateColor(value: number): string {
  if (value <= -2) return 'Use muted colors and film-like desaturation.';
  if (value === -1) return 'Use a subtle restrained color palette.';
  if (value === 1) return 'Use slightly richer colors with natural saturation.';
  if (value >= 2) return 'Use vibrant but realistic colors without oversaturation.';
  return 'Keep natural color rendering.';
}

function translateSharpness(value: number): string {
  if (value <= -2) return 'Use soft image rendering without losing important detail.';
  if (value >= 2) return 'Enhance edge definition naturally and avoid oversharpening.';
  return 'Keep natural sharpness.';
}

function translateClarity(value: number): string {
  if (value <= -2) return 'Use soft atmospheric rendering with gentle local contrast.';
  if (value === -1) return 'Use slightly softened local contrast for a smoother film feel.';
  if (value === 1) return 'Use mild texture separation and balanced local contrast.';
  if (value >= 2) return 'Use enhanced texture separation while avoiding harsh HDR effects.';
  return 'Keep balanced local contrast.';
}
