import { AnalysisResult, getFlowType, PickedPhoto } from '../../models/analysis';
import { PhotoAiTool } from '../../models/photoAiTool';
import { PhotoRecipe } from '../../models/photoRecipe';
import { buildDirectToolImagePrompt } from '../../services/photo-tools/directToolPromptBuilder';
import { buildPhotoRecipePrompt } from '../../services/photo-recipes/photoRecipePromptBuilder';
import { buildPhotoRecipePromptV2 } from '../../services/photo-recipes/photoRecipePromptBuilderV2';
import { getPhotoRecipe } from '../../services/photo-recipes/photoRecipeLibrary';

export function createDirectToolResult(
  photo: PickedPhoto,
  tool: PhotoAiTool,
  instruction?: string
): AnalysisResult {
  const now = new Date().toISOString();
  const cleanInstruction = instruction?.trim();

  return {
    analysisId: `direct:${tool.id}:${Date.now()}`,
    flowType: 'editingTool',
    overallAssessment: tool.detail,
    originalImageUri: photo.uri,
    originalImageMimeType: photo.mimeType,
    createdAt: now,
    suggestions: [
      {
        title: tool.title,
        concept: tool.detail,
        composition: 'Apply this edit directly to the selected photo.',
        camera_angle: 'Preserve the original perspective unless the selected tool requires frame expansion.',
        changes: [tool.subtitle, tool.promptFocus, cleanInstruction ? `User instruction: ${cleanInstruction}` : ''],
        image_prompt: buildDirectToolImagePrompt(tool, cleanInstruction)
      }
    ]
  };
}

export function createPhotoRecipeResult(photo: PickedPhoto, recipe: PhotoRecipe): AnalysisResult {
  const now = new Date().toISOString();

  return {
    analysisId: `recipe:${recipe.id}:${Date.now()}`,
    flowType: 'photoRecipe',
    overallAssessment: recipe.description ?? recipe.mood ?? 'Photo recipe',
    originalImageUri: photo.uri,
    originalImageMimeType: photo.mimeType,
    createdAt: now,
    suggestions: [
      {
        title: recipe.title || recipe.name || 'Photo Recipe',
        concept: recipe.description || recipe.mood || 'Apply photo recipe',
        composition: 'Apply this recipe look without changing composition.',
        camera_angle: 'Preserve the original camera angle and perspective.',
        changes: [
          recipe.subtitle || recipe.name || recipe.title || '',
          `Mood: ${recipe.promptPreset?.mood || recipe.mood || 'Standard'}`,
          recipe.promptPreset?.colorPalette ? `Palette: ${recipe.promptPreset.colorPalette}` : '',
          recipe.tags?.length ? `Tags: ${recipe.tags.join(', ')}` : ''
        ].filter(Boolean) as string[],
        image_prompt: process.env.EXPO_PUBLIC_PHOTO_RECIPE_VERSION === 'v2'
          ? buildPhotoRecipePromptV2(recipe)
          : buildPhotoRecipePrompt(recipe)
      }
    ]
  };
}

export function getRecipeFromResult(result?: AnalysisResult): PhotoRecipe | undefined {
  if (!result || getFlowType(result) !== 'photoRecipe') return undefined;
  const analysisId = result.sourceAnalysisId ?? result.analysisId;
  const recipeId = analysisId.split(':')[1];
  return recipeId ? getPhotoRecipe(recipeId) : undefined;
}
