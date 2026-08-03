import { CoachMode } from '../../core/store/analysisStore';
import { generateEditedImage } from '../openai/generateImage';
import { CAMERA_ANGLE_REFERENCE } from './cameraAngleReference';
import { COMPOSITION_REFERENCE } from './compositionReference';

export class DirectCoachService {
  /**
   * Generates a highly optimized system prompt for the GPT Image 2 endpoint based on the selected mode.
   * This skips the text analysis phase and goes straight to generating the reference image.
   */
  static getPromptForMode(mode: CoachMode): string {
    const basePrompt = 'Keep the person, identity, clothing, background, and lighting completely identical to the original image. ';

    switch (mode) {
      case 'composition':
        return `${basePrompt}Improve only the composition of this shot. Pick one realistic composition improvement such as rule of thirds, centered composition, leading lines, symmetry, framing, negative space, fill the frame, diagonal lines, golden ratio, triangular composition, rule of odds, balance, depth, layering, S-curve, asymmetry, patterns, repetition, minimalism, or visual weight. Adjust crop and subject placement within the same scene. Do not change pose, outfit, face, background location, lighting, camera angle, or shot distance unless a small crop shift is needed. Show what the same photo should look like with stronger composition.\n\nComposition reference:\n${COMPOSITION_REFERENCE}`;
      case 'frame':
        return basePrompt + 'Adjust the zoom level, camera distance, and crop to show the ideal framing for this shot (e.g. Medium Shot, Full Body, or Close-up depending on the context).';
      case 'angle':
        return `${basePrompt}Change only the camera angle and perspective to show the best angle for this shot. Pick one realistic angle improvement such as eye level, high angle, low angle, bird's eye view, worm's eye view, ground level, 3/4 profile, side angle, back view, over-the-shoulder, dutch angle, tilt up, or tilt down. Do not change pose, outfit, face, background, lighting, or framing distance unless the angle change requires a tiny perspective shift. Show what the same scene should look like from the improved camera angle.\n\nAngle reference:\n${CAMERA_ANGLE_REFERENCE}`;
      case 'pose':
        return basePrompt + 'Improve the subject\'s body posture and pose to be more aesthetically pleasing, natural, and confident, without changing their face or clothes. Make the pose look professional.';
      case 'comprehensive':
        return basePrompt + 'Improve the composition, framing, and pose all at once for a perfect, professional aesthetic photo.';
      default:
        return basePrompt + 'Improve the overall photographic aesthetic without changing the identity or scene.';
    }
  }

  /**
   * Calls the OpenAI image generation/edit API directly with the optimized prompt.
   */
  static async generateCoachImage(
    imageUri: string,
    mimeType: string,
    mode: CoachMode
  ): Promise<string> {
    const prompt = this.getPromptForMode(mode);
    // Uses the existing generateEditedImage which handles the /v1/images/edits endpoint logic
    return await generateEditedImage(prompt, imageUri, mimeType, 'ai_coach');
  }
}
