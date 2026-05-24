import { AnalysisResult } from '../../models/analysis';

export function createMockAnalysisResult(
  originalImageUri: string,
  originalImageMimeType = 'image/jpeg'
): AnalysisResult {
  const analysisId = `${Date.now()}`;
  const productionAnalysis = {
    schema_version: '1.0',
    photo_id: 'mock_photo',
    analysis_id: analysisId,
    scene: {
      photo_type: 'portrait',
      environment: 'visible lifestyle setting',
      visible_subjects: 'one person'
    },
    composition: {
      quality_score: 7.2,
      notes: 'The frame is readable but can use stronger subject placement and cleaner negative space.'
    },
    lighting: {
      quality_score: 6.8,
      notes: 'Light is usable but would benefit from softer contrast and more subject separation.'
    },
    pose: {
      quality_score: 7.1,
      notes: 'Pose feels natural; small posture and hand refinements would make it more premium.'
    },
    aesthetic: {
      overall_score: 7.3,
      notes: 'Strong subject presence; composition reads a bit centered and flat.'
    },
    scores: {
      composition_score: 7.2,
      lighting_score: 6.8,
      pose_score: 7.1,
      naturalness_score: 7.8,
      social_media_score: 7.5,
      overall_aesthetic_score: 7.3
    },
    overall_assessment:
      'Strong subject presence; composition reads a bit centered and flat. Lighting is workable but could be shaped for more depth. A reshoot or edit could push toward editorial polish.'
  };
  const creativeDirections = [
    {
      title: 'Cleaner Composition',
      concept: 'Minimalist and focused',
      composition: 'Rule of thirds — place subject on right vertical third; add negative space on look direction',
      camera_angle: 'Eye level, slight step back for context; optional mild telephoto compression',
      changes: {
        pose: ['Keep the same body structure and expression'],
        lighting: ['Keep natural light but soften facial contrast'],
        composition: [
          'Move the subject toward the right third',
          'Crop tighter vertically (4:5 for social)',
          'Simplify or blur busy background elements'
        ],
        style: ['Clean premium Instagram finish']
      }
    },
    {
      title: 'Look Taller',
      concept: 'Empowering low angle',
      composition: 'Diagonal energy — slight body turn with leading lines from environment toward face',
      camera_angle: 'Low angle from waist height, lens slightly below chest line',
      changes: {
        pose: [
          'Weight on back leg, front knee soft',
          'Relax shoulders and lengthen neck',
          'Eyes toward lens or just past camera for confidence'
        ],
        lighting: ['Add gentle face-forward light without changing the scene'],
        composition: ['Preserve the existing environment and leading lines'],
        style: ['Crisp premium fashion look']
      }
    },
    {
      title: 'Cinematic Lighting',
      concept: 'Dramatic and moody',
      composition: 'Cinematic wide or medium; stronger separation between subject and background',
      camera_angle: 'Eye level to slight low; avoid dutch tilt unless scene calls for it',
      changes: {
        pose: ['Keep the existing pose structure and identity'],
        lighting: [
          'Soft rim or edge light on hair and shoulders',
          'Controlled shadow contrast in background'
        ],
        composition: ['Preserve the same visible location'],
        style: ['Warm cinematic color grade, natural skin tones']
      }
    }
  ];
  const generationRecipes = creativeDirections.map(direction => ({
    direction_title: direction.title,
    model: {
      provider: 'openai',
      name: 'gpt-image'
    },
    image_prompt: {
      positive_prompt: `Edit this photo conservatively for "${direction.title}". Preserve the same person, identity, face, hairstyle, clothing, accessories, pose structure, and original environment/background. ${[
        direction.concept,
        direction.composition,
        direction.camera_angle,
        ...direction.changes.pose,
        ...direction.changes.lighting,
        ...direction.changes.composition,
        ...direction.changes.style
      ].join(' ')}`,
      negative_prompt:
        'extra fingers, distorted anatomy, plastic skin, changed identity, changed clothing, replaced background, new scene'
    },
    evaluation_targets: {
      identity_preservation: 8,
      naturalness: 7,
      anatomy_score: 8,
      overall_score: 7
    }
  }));

  return {
    analysisId,
    overallAssessment: productionAnalysis.overall_assessment,
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
    productionAnalysis,
    creativeDirections,
    generationRecipes,
    visualOutput: {
      type: 'overlay_only'
    },
    createdAt: new Date().toISOString(),
    originalImageUri,
    originalImageMimeType
  };
}
