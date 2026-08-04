import { CoachAgeRange, CoachGender, CoachSceneContext } from '../../models/coachPreferences';

export type CoachPreferenceOption<T extends string> = {
  id: T;
  label: string;
};

export const SCENE_CONTEXT_OPTIONS: CoachPreferenceOption<CoachSceneContext>[] = [
  { id: 'travel', label: 'Travel' },
  { id: 'street', label: 'Street' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'beach', label: 'Beach' },
  { id: 'nature', label: 'Nature' },
  { id: 'urban_night', label: 'City Night' },
  { id: 'indoor', label: 'Indoor' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'landmark', label: 'Landmark' }
];

export const GENDER_OPTIONS: CoachPreferenceOption<CoachGender>[] = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'non_binary', label: 'Non-binary' }
];

export const AGE_RANGE_OPTIONS: CoachPreferenceOption<CoachAgeRange>[] = [
  { id: 'under_18', label: 'Under 18' },
  { id: '18_24', label: '18-24' },
  { id: '25_34', label: '25-34' },
  { id: '35_44', label: '35-44' },
  { id: '45_plus', label: '45+' }
];

const optionLabel = <T extends string>(
  options: CoachPreferenceOption<T>[],
  value?: T
): string | undefined => options.find(option => option.id === value)?.label;

export function getSceneContextLabel(value?: CoachSceneContext): string | undefined {
  return optionLabel(SCENE_CONTEXT_OPTIONS, value);
}

export function getGenderLabel(value?: CoachGender): string | undefined {
  return optionLabel(GENDER_OPTIONS, value);
}

export function getAgeRangeLabel(value?: CoachAgeRange): string | undefined {
  return optionLabel(AGE_RANGE_OPTIONS, value);
}
