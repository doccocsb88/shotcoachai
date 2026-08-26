import { CoachMode } from '../../core/store/analysisStore';
import { CoachPreferences } from '../../models/coachPreferences';
import { generateDirectCoachImage } from '../openai/generateImage';
import { buildCoachDirectModeContext } from './coachPersonalizationBlock';
import { logCoachPrompt } from './coachPromptDebug';
import { CAMERA_ANGLE_REFERENCE } from './cameraAngleReference';
import { COMPOSITION_REFERENCE } from './compositionReference';

export class DirectCoachService {
  static getIntensityInstruction(mode: CoachMode, coachPreferences?: CoachPreferences): string {
    const intensity = coachPreferences?.editIntensity ?? 'balanced';

    switch (mode) {
      case 'composition':
        switch (intensity) {
          case 'safe':
            return 'Intensity: SAFE. Make minimal composition improvements. Keep the original crop, subject placement, and visual balance as close as possible. Only fix the most obvious composition weakness.';
          case 'aggressive':
            return 'Intensity: AGGRESSIVE. Make strong but believable composition improvements. You may significantly improve crop, subject placement, balance, negative space, and visual flow while keeping the same scene, pose, and lighting.';
          case 'balanced':
          default:
            return 'Intensity: BALANCED. Make clear but realistic composition improvements. You may moderately improve crop, subject placement, balance, and visual flow while preserving the same scene and identity.';
        }
      case 'frame':
        switch (intensity) {
          case 'safe':
            return 'Intensity: SAFE. Make minimal framing changes. Keep the original crop and camera distance close to the source image, and only refine obvious framing issues.';
          case 'aggressive':
            return 'Intensity: AGGRESSIVE. Make strong but believable framing improvements. You may significantly change crop, camera distance, and framing tightness to create a much stronger shot while preserving the same person, scene, and lighting.';
          case 'balanced':
          default:
            return 'Intensity: BALANCED. Make clear but realistic framing improvements. You may moderately adjust crop and camera distance to create a stronger and more intentional frame.';
        }
      case 'angle':
        switch (intensity) {
          case 'safe':
            return 'Intensity: SAFE. Make minimal angle changes. Keep the original viewpoint close to the source image and only correct the most obvious camera-angle weakness.';
          case 'aggressive':
            return 'Intensity: AGGRESSIVE. Make strong but believable angle improvements. You may significantly change camera height, horizontal viewpoint, and perspective to create a much stronger shot while keeping the same person, scene, and lighting.';
          case 'balanced':
          default:
            return 'Intensity: BALANCED. Make clear but realistic angle improvements. You may moderately improve camera height, viewpoint, and perspective to create a stronger photo while preserving the same scene and identity.';
        }
      case 'pose':
        switch (intensity) {
          case 'safe':
            return 'Intensity: SAFE. Make minimal pose refinements. Keep the original body position close to the source image and only correct the most obvious posture issue.';
          case 'aggressive':
            return 'Intensity: AGGRESSIVE. Make strong but believable pose improvements. You may significantly refine posture, body angle, hand placement, and stance to create a much more intentional and flattering result while keeping the same identity, outfit, and scene.';
          case 'balanced':
          default:
            return 'Intensity: BALANCED. Make clear but realistic pose improvements. You may moderately refine posture, body angle, and hand placement to create a stronger and more natural pose.';
        }
      case 'comprehensive':
      default:
        switch (intensity) {
          case 'safe':
            return 'Intensity: SAFE. Make minimal, conservative improvements. Keep the original pose, camera viewpoint, framing, and composition as close as possible. Only fix the most obvious weaknesses.';
          case 'aggressive':
            return 'Intensity: AGGRESSIVE. Make strong but believable improvements. You may significantly improve pose, camera viewpoint, framing, crop, and subject placement to create a much more intentional and flattering result, while keeping the same person, outfit, background, and lighting.';
          case 'balanced':
          default:
            return 'Intensity: BALANCED. Make clear but realistic improvements. You may moderately improve pose, camera viewpoint, framing, crop, and subject placement to create a stronger photo while preserving the same scene and identity.';
        }
    }
  }

  /**
   * Generates a highly optimized system prompt for the GPT Image 2 endpoint based on the selected mode.
   * This skips the text analysis phase and goes straight to generating the reference image.
   */
  static getPromptForMode(mode: CoachMode, coachPreferences?: CoachPreferences): string {
    const contextPrefix = buildCoachDirectModeContext(coachPreferences);
    const basePrompt =
      'Keep the person, identity, clothing, background, and lighting completely identical to the original image. ';

    switch (mode) {
      case 'composition':
        return `${contextPrefix}${basePrompt}Improve only the composition of this shot. Pick one realistic composition improvement such as rule of thirds, centered composition, leading lines, symmetry, framing, negative space, fill the frame, diagonal lines, golden ratio, triangular composition, rule of odds, balance, depth, layering, S-curve, asymmetry, patterns, repetition, minimalism, or visual weight. Adjust crop and subject placement within the same scene. ${this.getIntensityInstruction(mode, coachPreferences)} Do not change pose, outfit, face, background location, lighting, camera angle, or shot distance unless a small crop shift is needed. Show what the same photo should look like with stronger composition.\n\nComposition reference:\n${COMPOSITION_REFERENCE}`;
      case 'frame':
        return `${contextPrefix}${basePrompt}Adjust the zoom level, camera distance, and crop to show the ideal framing for this shot (e.g. Medium Shot, Full Body, or Close-up depending on the context). ${this.getIntensityInstruction(mode, coachPreferences)} Keep the same person, pose, scene, and lighting.`;
      case 'angle':
        return `${contextPrefix}${basePrompt}Change only the camera angle and perspective to show the best angle for this shot. Pick one realistic angle improvement such as eye level, high angle, low angle, bird's eye view, worm's eye view, ground level, 3/4 profile, side angle, back view, over-the-shoulder, dutch angle, tilt up, or tilt down. ${this.getIntensityInstruction(mode, coachPreferences)} Do not change pose, outfit, face, background, lighting, or framing distance unless the angle change requires a tiny perspective shift. Show what the same scene should look like from the improved camera angle.\n\nAngle reference:\n${CAMERA_ANGLE_REFERENCE}`;
      case 'pose':
        return `${contextPrefix}${basePrompt}Improve the subject's body posture and pose to be more aesthetically pleasing, natural, and confident, without changing their face or clothes. ${this.getIntensityInstruction(mode, coachPreferences)} Make the pose look professional.`;
      case 'comprehensive':
        return (
          `${contextPrefix}${basePrompt}` +
          'This is COMPREHENSIVE MODE. Improve the photo by combining pose, composition, camera angle, and framing into one stronger result. ' +
          'Keep the same person, identity, face, hairstyle, clothing, background, location, and lighting. Preserve the same real scene and overall mood. ' +
          'You may adjust the subject pose, camera viewpoint, subject placement in the frame, crop, and camera distance as needed to create a more flattering and intentional photo. ' +
          `${this.getIntensityInstruction(mode, coachPreferences)} ` +
          'Choose realistic improvements only. The result should feel like the same person in the same moment, just shot from a better position with a better pose and better framing. ' +
          'Do not redesign the environment, change the outfit, replace the background, alter the lighting style, or create a different scene. ' +
          'Output one polished, believable improved version of the same photo with better pose, composition, angle, and framing.'
        );
      default:
        return contextPrefix + basePrompt + 'Improve the overall photographic aesthetic without changing the identity or scene.';
    }
  }

  /**
   * Calls the OpenAI image generation/edit API directly with the optimized prompt.
   */
  static async generateCoachImage(
    imageUri: string,
    mimeType: string,
    mode: CoachMode,
    coachPreferences?: CoachPreferences
  ): Promise<string> {
    const prompt = this.getPromptForMode(mode, coachPreferences);
    logCoachPrompt({
      stage: 'direct-image-edit',
      coachMode: mode,
      coachPreferences,
      prompt
    });
    return generateDirectCoachImage(imageUri, mimeType, mode, coachPreferences);
  }
}
