import type { ImageSourcePropType } from 'react-native';

import { PhotoAiToolId } from '../../models/photoAiTool';

export const compositionSuggestionIconSources: Record<string, ImageSourcePropType> = {
  'Rule of Thirds': require('../../../assets/icons/composition-suggestions/rule-of-thirds.png'),
  Symmetrical: require('../../../assets/icons/composition-suggestions/symmetrical.png'),
  'Subject Focus': require('../../../assets/icons/composition-suggestions/subject-focus.png'),
  'Centered Portrait': require('../../../assets/icons/composition-suggestions/centered-portrait.png'),
  'Cinematic Framing': require('../../../assets/icons/composition-suggestions/cinematic-framing.png'),
  'Social Media Ready': require('../../../assets/icons/composition-suggestions/social-media-ready.png'),
  'Travel Photography': require('../../../assets/icons/composition-suggestions/travel-photography.png'),
  'Professional Portrait': require('../../../assets/icons/composition-suggestions/professional-portrait.png')
};

export const enhanceSuggestionIconSources: Record<string, ImageSourcePropType> = {
  'Professional look': require('../../../assets/icons/enhance-suggestions/professional-look.png'),
  'Natural detail': require('../../../assets/icons/enhance-suggestions/natural-detail.png'),
  'Sharper photo': require('../../../assets/icons/enhance-suggestions/sharper-photo.png')
};

export const toolPromptTags: Record<PhotoAiToolId, string[]> = {
  ai_coach: ['Pose', 'Framing', 'Lighting'],
  enhance_photo: ['Professional', 'Natural', 'Detail'],
  better_composition: ['Framing', 'Balance', 'Subject placement'],
  light_color: ['Lighting', 'Exposure', 'Tone'],
  restore_color: ['Color', 'Saturation', 'Skin tone'],
  upscale: ['Clarity', 'Sharpness', '2K/4K'],
  background_boost: ['Background', 'Depth', 'Scenery'],
  replace_background: ['New scene', 'Subject safe', 'Realistic'],
  remove_object: ['Cleanup', 'Object removal', 'Natural fill'],
  expand_frame: ['Outpaint', 'More space', 'Composition'],
  smooth_skin: ['Portrait', 'Skin texture', 'Natural retouch'],
  photo_recipe: ['Film look', 'Color', 'Mood']
};
