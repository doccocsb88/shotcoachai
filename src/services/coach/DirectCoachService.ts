import { CoachMode } from '../../core/store/analysisStore';
import { generateEditedImage } from '../openai/generateImage';

export class DirectCoachService {
  /**
   * Generates a highly optimized system prompt for the GPT Image 2 endpoint based on the selected mode.
   * This skips the text analysis phase and goes straight to generating the reference image.
   */
  static getPromptForMode(mode: CoachMode): string {
    const basePrompt = 'Keep the person, identity, clothing, background, and lighting completely identical to the original image. ';

    switch (mode) {
      case 'composition':
        return basePrompt + 'Adjust only the crop and placement of the subject to achieve a perfect Rule of Thirds composition. Show what the perfectly framed shot should look like.';
      case 'frame':
        return basePrompt + 'Adjust the zoom level, camera distance, and crop to show the ideal framing for this shot (e.g. Medium Shot, Full Body, or Close-up depending on the context).';
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
