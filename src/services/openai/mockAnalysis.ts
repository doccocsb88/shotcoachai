import { AnalysisResult } from '../../models/analysis';

export function createMockAnalysisResult(
  originalImageUri: string,
  originalImageMimeType = 'image/jpeg'
): AnalysisResult {
  return {
    analysisId: `${Date.now()}`,
    overallAssessment:
      'Strong subject presence; composition reads a bit centered and flat. Lighting is workable but could be shaped for more depth. A reshoot or edit could push toward editorial polish.',
    suggestions: [
      {
        title: 'Cleaner Composition',
        concept: 'Minimalist and focused',
        composition: 'Rule of thirds — place subject on right vertical third; add negative space on look direction',
        camera_angle: 'Eye level, slight step back for context; optional mild telephoto compression',
        changes: [
          'Move the subject toward the right third',
          'Crop tighter vertically (4:5 for social)',
          'Simplify or blur busy background elements'
        ],
        image_prompt:
          'Edit this photo: same person, same identity. Reposition subject on right third, vertical 4:5 crop, cleaner blurred background, natural eye-level camera, soft natural light, premium Instagram aesthetic, photorealistic.'
      },
      {
        title: 'Look Taller',
        concept: 'Empowering low angle',
        composition: 'Diagonal energy — slight body turn with leading lines from environment toward face',
        camera_angle: 'Low angle from waist height, lens slightly below chest line',
        changes: [
          'Weight on back leg, front knee soft',
          'Relax shoulders and lengthen neck',
          'Eyes toward lens or just past camera for confidence'
        ],
        image_prompt:
          'Edit this photo: same person, same identity. Low-angle hero shot from waist height, longer legs in frame, subtle leading lines, crisp premium fashion look, realistic anatomy, photorealistic.'
      },
      {
        title: 'Cinematic Lighting',
        concept: 'Dramatic and moody',
        composition: 'Cinematic wide or medium; stronger separation between subject and background',
        camera_angle: 'Eye level to slight low; avoid dutch tilt unless scene calls for it',
        changes: [
          'Soft rim or edge light on hair and shoulders',
          'Controlled shadow contrast in background',
          'Warm cinematic color grade, natural skin tones'
        ],
        image_prompt:
          'Edit this photo: same person, same identity. Cinematic lighting with gentle rim light, deeper background shadows, warm premium color grade, natural skin, shallow depth of field, photorealistic.'
      }
    ],
    visualOutput: {
      type: 'overlay_only'
    },
    createdAt: new Date().toISOString(),
    originalImageUri,
    originalImageMimeType
  };
}
