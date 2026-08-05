export type CoachGender = 'female' | 'male' | 'non_binary';
export type CoachAgeRange = 'under_18' | '18_24' | '25_34' | '35_44' | '45_plus';
export type CoachEditIntensity = 'safe' | 'balanced' | 'aggressive';
export type CoachSceneContext =
  | 'travel'
  | 'street'
  | 'cafe'
  | 'beach'
  | 'nature'
  | 'urban_night'
  | 'indoor'
  | 'restaurant'
  | 'landmark';

export type CoachPreferences = {
  gender?: CoachGender;
  ageRange?: CoachAgeRange;
  sceneContext?: CoachSceneContext;
  editIntensity?: CoachEditIntensity;
};

export const DEFAULT_COACH_PREFERENCES: CoachPreferences = {};

export function hasCoachPreferences(preferences: CoachPreferences): boolean {
  return Boolean(
    preferences.gender || preferences.ageRange || preferences.sceneContext || preferences.editIntensity
  );
}
