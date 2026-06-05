export type RecipeCategory =
  | 'portrait'
  | 'beach'
  | 'travel'
  | 'nature'
  | 'indoor'
  | 'cafe'
  | 'street'
  | 'city'
  | 'night'
  | 'anime'
  | 'pastel'
  | 'ocean'
  | 'lifestyle'
  | 'urban'
  | 'coastal'
  | 'film'
  | 'summer';

export interface RecipeParameters {
  filmSimulation: string;
  highlight: number;
  shadow: number;
  color: number;
  sharpness: number;
  clarity: number;
  grain: string;
  dynamicRange: string;
  whiteBalance: string;
}

export interface PromptPreset {
  mood: string;
  colorPalette: string;
  lighting: string;
  contrast: string;
  saturation: string;
  grainDescription: string;
  negativePrompt: string;
}

// V2 Parameter Structures
export interface WhiteBalanceV2 {
  mode: string;
  redShift: number;
  blueShift: number;
}

export interface GrainV2 {
  enabled: boolean;
  size: string;
  strength: string;
}

export interface RecipeParametersV2 {
  filmSimulation: string;
  whiteBalance: WhiteBalanceV2;
  dynamicRange: string;
  grain: GrainV2;
  colorChromeEffect: string;
  colorChromeFXBlue: string;
  highlight: number;
  shadow: number;
  color: number;
  sharpness: number;
  noiseReduction: number;
  clarity: number;
  exposureCompensation?: string;
}

export interface PhotoRecipe {
  id: string;
  name?: string; // V2 uses name instead of title
  title?: string; // V1
  subtitle?: string; // V1
  category: RecipeCategory;
  thumbnail?: ImageSourcePropType;
  tags?: string[];
  description?: string; // V1
  
  // V1 specific
  recipeParameters?: RecipeParameters;
  promptPreset?: PromptPreset;

  // V2 specific
  filmSimulation?: string;
  whiteBalance?: WhiteBalanceV2;
  dynamicRange?: string;
  grain?: GrainV2;
  colorChromeEffect?: string;
  colorChromeFXBlue?: string;
  highlight?: number;
  shadow?: number;
  color?: number;
  sharpness?: number;
  noiseReduction?: number;
  clarity?: number;
  exposureCompensation?: string;
  mood?: string;
  recommendedFor?: string[];
}

export interface RecipeVisualIntent {
  highlightIntent: string;
  shadowIntent: string;
  colorIntent: string;
  sharpnessIntent: string;
  clarityIntent: string;
}
import { ImageSourcePropType } from 'react-native';
