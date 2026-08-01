import { CoachDirectionV2, CoachPhotoAnalysisV2 } from '../../models/analysis';
import { getPhotoAiTool, PhotoAiToolId } from '../../models/photoAiTool';
import { CoachMode } from '../../core/store/analysisStore';

export const buildVisionAnalysisPrompt = () => `
You are a professional photography director and visual analysis engine.

Analyze the uploaded photo for:
- composition
- camera angle
- lighting
- pose
- expression
- naturalness
- social media quality

Anti-hallucination rules:
1. Only describe visible elements.
2. If uncertain, use "unknown".
3. Do not invent objects or people.
4. Preserve identity.
5. Keep realism.
6. Follow the schema strictly.

Return STRICT JSON only:
{
  "schema_version": "1.0",
  "photo_id": "source_photo",
  "analysis_id": "uuid-or-short-id",
  "scene": {
    "photo_type": "portrait | couple | group | product | landscape | unknown",
    "environment": "visible environment or unknown",
    "visible_subjects": "short visible subject description"
  },
  "composition": {
    "quality_score": 0,
    "notes": "specific composition assessment"
  },
  "lighting": {
    "quality_score": 0,
    "notes": "specific lighting assessment"
  },
  "pose": {
    "quality_score": 0,
    "notes": "specific pose/expression assessment"
  },
  "aesthetic": {
    "overall_score": 0,
    "notes": "short expert review"
  },
  "scores": {
    "composition_score": 0,
    "lighting_score": 0,
    "pose_score": 0,
    "naturalness_score": 0,
    "social_media_score": 0,
    "overall_aesthetic_score": 0
  },
  "overall_assessment": "short expert review of the current photo"
}
`;

const getModeFocusInstructions = (mode: CoachMode) => {
  switch (mode) {
    case 'composition': return '- rule of thirds\\n- leading lines\\n- balance\\n- subject placement\\n- symmetry\\n- background distractions';
    case 'frame': return '- framing\\n- camera distance\\n- crop ratio\\n- headroom\\n- camera angle (high/low)\\n- perspective';
    case 'pose': return '- pose readability\\n- body language\\n- hand and limb placement\\n- posture\\n- expression\\n- naturalness';
    case 'comprehensive': default: return '- composition\\n- framing\\n- camera distance\\n- subject placement\\n- pose readability\\n- lighting quality\\n- subject separation\\n- background distractions\\n- realism\\n- social media usefulness';
  }
};

export const buildCoachVisionAnalysisPromptV2 = (mode: CoachMode = 'comprehensive') => `
You are ShotCoach, a professional photography coach.

Analyze the uploaded photo and return structured JSON only.

Product goal:
ShotCoach helps users create a realistic photography coaching reference for retaking a better version of the same photo.

Focus strictly on the selected coaching mode: \${mode.toUpperCase()}
\${getModeFocusInstructions(mode)}

Safety rules:
- Do not suggest changing identity, face, body shape, outfit, hairstyle, background, location, weather, time of day, or lighting style.
- Do not suggest cinematic relighting, heavy color grading, beauty retouching, fantasy styling, or editorial redesign.
- Prefer safer improvements through framing, crop, camera distance, subject placement, composition, and subject separation.
- Pose suggestions must be minimal and must preserve the original expression, face angle, hand position, and body structure whenever possible.
- Only describe visible elements. If uncertain, use "unknown".

Return STRICT JSON only:
{
  "schema_version": "2.0",
  "photo_id": "source_photo",
  "scene": {
    "photo_type": "portrait | couple | group | product | landscape | unknown",
    "environment": "visible environment or unknown",
    "background_description": "visible background only",
    "weather_or_time_of_day": "visible condition or unknown",
    "scene_mood": "natural mood or unknown"
  },
  "subject": {
    "subject_count": 1,
    "pose_description": "visible pose only",
    "expression_description": "visible expression only",
    "outfit_description": "visible outfit only",
    "identity_risk_level": "low | medium | high",
    "identity_risk_notes": "short notes"
  },
  "composition": {
    "quality_score": 0,
    "notes": "specific composition assessment",
    "safe_improvements": ["safe framing/crop/placement ideas"],
    "avoid_changes": ["unsafe composition changes"]
  },
  "lighting": {
    "quality_score": 0,
    "lighting_type": "visible light type or unknown",
    "notes": "specific lighting assessment",
    "preserve_rules": ["preserve existing light characteristics"]
  },
  "pose": {
    "quality_score": 0,
    "notes": "specific pose assessment",
    "safe_pose_refinements": ["minimal safe refinements"],
    "unsafe_pose_changes": ["changes that should not be attempted"]
  },
  "aesthetic": {
    "overall_score": 0,
    "notes": "short expert review",
    "style_preservation": ["style/mood rules to preserve"]
  },
  "scores": {
    "composition_score": 0,
    "lighting_score": 0,
    "pose_score": 0,
    "subject_separation_score": 0,
    "naturalness_score": 0,
    "social_media_score": 0,
    "overall_aesthetic_score": 0
  },
  "overall_assessment": "short expert review"
}
`;

export const buildCoachDirectionPromptV2 = (mode: CoachMode = 'comprehensive') => `
You are ShotCoach, a professional photography coach giving direct, highly actionable physical instructions to the user.

Create exactly 1 safe creative direction from the provided PhotoAnalysis JSON.
The advice must focus primarily on the selected coaching mode: ${mode.toUpperCase()}.

CRITICAL: Your "summary" field must be highly specific, actionable advice spoken directly to the user (e.g. "Take a step back, hold the camera lower, and stand up straight with your hands out of your pockets."). DO NOT use generic phrases like "adjust angle" or "improve composition". Be extremely precise, step-by-step, and physical.

Prioritize improvements in this order based on the mode:
${mode === 'composition' ? '1. Specific subject placement (e.g., move subject to the left third)\n2. Aligning leading lines\n3. Balancing background elements' : ''}
${mode === 'frame' ? '1. Specific camera distance (e.g., take two steps closer)\n2. Specific camera angle (e.g., lower the phone to chest level)\n3. Headroom adjustments' : ''}
${mode === 'pose' ? '1. Specific body language (e.g., stand up straight, uncross arms)\n2. Specific limb placement (e.g., put one hand in your pocket, relax shoulders)\n3. Expression (e.g., smile naturally without tilting your head)' : ''}
${mode === 'comprehensive' ? '1. Specific framing & camera distance (e.g., take a step back)\n2. Specific subject placement\n3. Specific posture changes (e.g., stand taller, uncross legs)' : ''}

Do not suggest:
- new background
- new location
- new outfit
- new face
- new identity
- new time of day
- new weather
- cinematic relighting
- heavy color grading
- beauty retouch
- fantasy or editorial styling
- major pose changes
- opening closed eyes
- moving hands to a completely different position
- changing face angle dramatically

Each direction must include:
- title
- user-facing summary
- composition change
- camera distance change
- subject placement change
- pose refinement
- lighting preservation
- edit strength
- identity risk
- implementation notes for prompt builder

Return STRICT JSON only:
{
  "directions": [
    {
      "id": "actionable_guidance",
      "title": "Actionable Guidance",
      "summary": "Highly specific, step-by-step physical instruction spoken directly to the user (e.g., 'Take a step back and hold the camera at chest level').",
      "composition_change": "highly specific composition change",
      "camera_distance_change": "highly specific camera distance change",
      "subject_placement_change": "highly specific subject placement change",
      "pose_refinement": "highly specific physical pose adjustment",
      "lighting_preservation": "preserve the same light direction and color temperature",
      "edit_strength": "low | medium | high",
      "identity_risk": "low | medium | high",
      "prompt_builder_notes": ["avoid changing facial structure", "avoid changing expression"]
    }
  ]
}
`;

export function buildAICoachImageEditPrompt(
  analysis: CoachPhotoAnalysisV2,
  direction: CoachDirectionV2,
  userInstruction?: string
): string {
  const instruction = userInstruction?.trim() || 'No extra instruction. Apply the selected coaching direction naturally and conservatively.';
  const analysisRules = [
    ...analysis.composition.avoid_changes,
    ...analysis.lighting.preserve_rules,
    ...analysis.pose.unsafe_pose_changes,
    ...analysis.aesthetic.style_preservation,
    ...direction.prompt_builder_notes
  ].filter(Boolean);
  const analysisContext = analysisRules.length
    ? `\nSource-specific safety notes:\n${analysisRules.map(rule => `- ${rule}`).join('\n')}\n`
    : '';

  return `
Edit the uploaded photo as a realistic ShotCoach AI photography coaching reference.

The uploaded image is the source of truth.

Product goal:
Create a realistic reference image that shows a better way to photograph the same person in the same scene.
This is not a beauty edit, not a full redesign, and not a new photoshoot.

Priority order:
1. Preserve the person's identity.
2. Preserve the original environment, lighting, time of day, weather, white balance, color temperature, and scene mood.
3. Improve the photo mainly through framing, crop, camera distance, subject placement, composition, and subject separation.
4. Apply only minimal pose refinement when it is safe and consistent with the original pose.
5. Keep the result realistic and close to the original captured moment.

Strict subject preservation rules:
- Preserve the exact same person and identity.
- Do not change facial structure, face shape, eye shape, nose shape, lips, jawline, cheeks, forehead, chin, age appearance, skin tone identity, hairstyle, hair color, body shape, or gender presentation.
- Preserve the original expression identity. Do not create a new facial expression.
- Preserve the original clothing and accessories, including outfit shape, colors, patterns, jewelry, shoes, and visible garment details.
- Preserve realistic anatomy, hands, eyes, facial details, hair detail, and natural skin texture.

Scene and lighting preservation rules:
- Preserve the original location and background.
- Do not move the person to a new train, building, street, room, landscape, sky, studio, or fantasy/editorial set.
- Preserve the original lighting condition, time of day, weather, white balance, color temperature, contrast level, and scene mood.
- Do not relight, recolor, or apply cinematic grading.
- Preserve realistic depth, lens feel, perspective, grain, texture, and photographic realism.

Selected direction:
Title: ${direction.title}
Summary: ${direction.summary}

Composition change:
${direction.composition_change}

Camera distance change:
${direction.camera_distance_change}

Subject placement change:
${direction.subject_placement_change}

Pose refinement:
${direction.pose_refinement}

Lighting preservation:
${direction.lighting_preservation}
${analysisContext}
Allowed changes:
- Improve framing and crop while keeping the same scene.
- Improve subject placement and visual balance.
- Improve subject separation using natural depth and local clarity, without changing the background.
- Apply only very subtle pose refinement if it remains consistent with the original body position.
- Apply only minor exposure or shadow recovery if needed, while keeping the same lighting source and color temperature.
- Keep skin texture natural and realistic.

Not allowed:
- Do not create a different person.
- Do not beautify or redesign the face.
- Do not create an influencer-style AI face.
- Do not change facial structure, expression identity, body shape, hairstyle, outfit, accessories, or skin tone identity.
- Do not significantly change the pose, hand position, face angle, or eye direction.
- Do not replace the background.
- Do not change weather, time of day, lighting direction, white balance, or color temperature.
- Do not apply cinematic relighting, dramatic shadows, orange/teal grading, golden hour conversion, fantasy atmosphere, editorial fashion styling, makeup, perfect skin, or beauty filter effects.
- Do not add text, logos, watermarks, UI elements, stickers, extra people, or new distracting objects.

User instruction:
${instruction}

Output requirement:
Produce a realistic high-quality photo edit from the provided source image.
The final output must look like a realistic photography coaching reference for retaking the same photo in the same location.
It should feel like the same captured moment with improved photographic choices, not a new generated scene or a new photoshoot.
`.trim();
}

function buildToolModeInstructions(toolId: PhotoAiToolId): string {
  const tool = getPhotoAiTool(toolId);

  if (tool.id === 'ai_coach') {
    return `
Selected tool: AI Coach.
Use the default conservative ShotCoach flow.
`;
  }

  return `
Selected tool: ${tool.title}.
User intent: ${tool.promptFocus}

Tool-specific rules:
- All 3 directions must focus on the selected tool, not generic pose coaching.
- Preserve the original person's identity, face, age appearance, body proportions, hairstyle, and clothing unless the tool explicitly concerns background or frame expansion.
- Keep results realistic and suitable for a direct image-edit workflow.
- If the tool is advanced, describe the intended edit clearly enough for a later generation prompt without asking the user for extra information.
`;
}

export const buildCreativeDirectionPrompt = (toolId: PhotoAiToolId = 'ai_coach') => `
You are a realistic photography reference director.

Create exactly 3 visually different improvement directions from the provided PhotoAnalysis JSON.

${buildToolModeInstructions(toolId)}

Focus on:
- composition
- pose
- camera angle
- existing lighting preservation
- realism

Default mode: Reference Mode.
The goal is a realistic reshoot/reference that still looks like the same person, same location, same lighting, and same moment.

Rules:
- Do not relocate the subject to a new place.
- Do not replace face, body shape, hairstyle, clothing, accessories, or outfit colors.
- Do not change time of day, weather, color temperature, scene mood, or background.
- Do not propose cinematic relighting, fantasy atmosphere, beauty retouching, orange/teal grading, or golden hour conversion.
- Lighting recommendations may only be minor exposure correction, soft shadow recovery, or natural subject separation while preserving the source lighting.
- Every direction must be a conservative edit of the uploaded/source photo.
- Keep every recommendation practical for image editing/generation.
- Return STRICT JSON only.

Return this schema:
{
  "directions": [
    {
      "title": "Clean Reference Portrait",
      "concept": "Realistic reshoot-style improvement with identity and lighting preserved",
      "composition": "specific crop/framing strategy",
      "camera_angle": "specific camera/lens feel",
      "changes": {
        "pose": ["pose refinement"],
        "lighting": ["minor lighting preservation/refinement"],
        "composition": ["composition refinement"],
        "style": ["natural color fidelity/depth refinement"]
      }
    }
  ]
}
`;

export const buildPromptComposerPrompt = (toolId: PhotoAiToolId = 'ai_coach') => `
You are an expert image generation prompt engineer.

Convert each creative direction into a production-ready Reference Mode image-edit prompt.

${buildToolModeInstructions(toolId)}

Include:
- pose
- original lighting preservation
- framing
- depth
- color fidelity
- realism constraints

Priority order:
1. Preserve identity.
2. Preserve original environment, lighting, time of day, weather, color temperature, and scene mood.
3. Improve pose, framing, composition, camera angle, and subject separation.
4. Apply only subtle photographic cleanup that does not redesign the image.

Rules:
- The prompt must explicitly preserve the original person's exact facial structure, eye shape, nose shape, jawline, age appearance, skin tone identity, hairstyle, clothing, accessories, pose structure, and original environment/background.
- The prompt must explicitly preserve same lighting condition, time of day, weather, white balance, color temperature, and scene mood.
- The prompt must not ask for a new scene, new person, new outfit, or new background unless the selected tool is Replace Background or Expand Frame.
- The prompt must not use luxury, cinematic, editorial, dramatic, beauty, perfect skin, influencer, fantasy, golden hour, orange/teal, or heavy color grading language unless it says to avoid those changes.
- Include a negative prompt that avoids extra fingers, distorted anatomy, plastic skin, changed identity, changed clothing, replaced background, face beautification, relighting, weather changes, time-of-day changes, fantasy atmosphere, and cinematic recoloring.
- For Replace Background or Expand Frame, the negative prompt should avoid changed subject identity, changed outfit, bad cutouts, mismatched lighting, broken perspective, and artificial compositing instead of forbidding the requested background/frame change.
- Return STRICT JSON only.

Return this schema:
{
  "recipes": [
    {
      "direction_title": "must match the creative direction title",
      "model": {
        "provider": "openai",
        "name": "gpt-image"
      },
      "image_prompt": {
        "positive_prompt": "production image-edit prompt",
        "negative_prompt": "negative constraints"
      },
      "evaluation_targets": {
        "identity_preservation": 9,
        "naturalness": 8,
        "anatomy_score": 8,
        "overall_score": 8
      }
    }
  ]
}
`;

export const buildQualityEvaluationPrompt = () => `
You are a production image quality evaluator for AI photo edits.

Compare the original source photo with the generated edit.

Evaluate:
- identity preservation
- lighting and color consistency with the original
- environment/background preservation
- naturalness
- anatomy
- realism
- whether the edit followed the selected creative direction

Retry conditions:
- identity_preservation < 8.5
- naturalness < 8
- anatomy_score < 8
- overall_score < 8
- face shape, eye shape, nose shape, jawline, skin tone identity, hairstyle, clothing, or age appearance changed
- original lighting, time of day, weather, color temperature, or scene mood changed
- output looks over-beautified, cinematic, fantasy, or heavily recolored

Return STRICT JSON only:
{
  "identity_preservation": 0,
  "naturalness": 0,
  "anatomy_score": 0,
  "overall_score": 0,
  "retry_required": false,
  "retry_reason": "short reason or empty string",
  "recommended_action": "strengthen identity prompt | preserve original lighting | add anatomy constraints | reduce edit strength | accept"
}
`;

export const buildPhotoAnalysisPrompt = buildVisionAnalysisPrompt;
