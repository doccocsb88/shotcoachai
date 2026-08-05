import {
  getAgeRangeLabel,
  getEditIntensityLabel,
  getGenderLabel,
  getSceneContextLabel
} from '../../features/camera/coachPreferenceConfig';
import { CoachPreferences, hasCoachPreferences } from '../../models/coachPreferences';

export function buildCoachPersonalizationBlock(preferences?: CoachPreferences): string {
  if (!preferences || !hasCoachPreferences(preferences)) {
    return '';
  }

  const sceneLabel = getSceneContextLabel(preferences.sceneContext) ?? 'unspecified';
  const genderLabel = getGenderLabel(preferences.gender) ?? 'unspecified';
  const ageLabel = getAgeRangeLabel(preferences.ageRange) ?? 'unspecified';
  const intensityLabel = getEditIntensityLabel(preferences.editIntensity) ?? 'unspecified';

  const profileParts = [
    preferences.gender ? `Gender presentation: ${genderLabel}` : null,
    preferences.ageRange ? `Age range: ${ageLabel}` : null,
    preferences.sceneContext ? `Intended shooting context: ${sceneLabel}` : null,
    preferences.editIntensity ? `Comprehensive intensity: ${intensityLabel}` : null
  ].filter(Boolean);

  return `
=== COACH MODE — SHOOTING CONTEXT ===
SUBORDINATE TO ALL SAFETY RULES ABOVE.

The user is trying to take a ${sceneLabel.toLowerCase()}-style photo.
Use this context ONLY to tailor pose, framing, and composition suggestions within the visible scene.
Do NOT change location, background, lighting, outfit, or identity.

${profileParts.map(part => `- ${part}`).join('\n')}

Tailoring rules:
- Scene context informs WHAT to suggest, not WHERE the photo takes place.
- If the visible scene does not match the selected context, prioritize the actual photo.
- Use gender and age only for pose comfort and framing appropriateness. Avoid stereotypes.
`.trim();
}

export function buildCoachDirectModeContext(preferences?: CoachPreferences): string {
  if (!preferences || !hasCoachPreferences(preferences)) {
    return '';
  }

  const sceneLabel = getSceneContextLabel(preferences.sceneContext);
  const intensityLabel = getEditIntensityLabel(preferences.editIntensity);
  if (!sceneLabel && !intensityLabel) {
    return '';
  }

  const parts = [
    sceneLabel
      ? `User context (shooting context: ${sceneLabel.toLowerCase()}). Tailor framing and composition for this type of shot within the same visible scene.`
      : null,
    intensityLabel ? `Comprehensive intensity preference: ${intensityLabel}.` : null
  ].filter(Boolean);

  return `${parts.join(' ')} `;
}
