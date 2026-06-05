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
  | 'film';

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

export interface PhotoRecipe {
  id: string;
  title: string;
  subtitle: string;
  category: RecipeCategory;
  thumbnail: ImageSourcePropType;
  tags: string[];
  description: string;
  recipeParameters: RecipeParameters;
  promptPreset: PromptPreset;
}

export interface RecipeVisualIntent {
  highlightIntent: string;
  shadowIntent: string;
  colorIntent: string;
  sharpnessIntent: string;
  clarityIntent: string;
}
import { ImageSourcePropType } from 'react-native';
