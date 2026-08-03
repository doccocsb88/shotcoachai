import { CoachMode } from '../../core/store/analysisStore';

export type CoachModeOption = {
  id: CoachMode;
  label: string;
  image: number;
};

export const COACH_MODE_OPTIONS: CoachModeOption[] = [
  { id: 'frame', label: 'Frame Coach', image: require('../../../assets/coaches/frame.png') },
  { id: 'composition', label: 'Composition Coach', image: require('../../../assets/coaches/composition.png') },
  { id: 'angle', label: 'Angle Coach', image: require('../../../assets/coaches/angle.png') },
  { id: 'pose', label: 'Pose Coach', image: require('../../../assets/coaches/pose.png') },
  { id: 'comprehensive', label: 'Comprehensive Coach', image: require('../../../assets/coaches/comprehensive.png') }
];

export const COACH_MODE_IDS = COACH_MODE_OPTIONS.map(option => option.id);

export function getCoachModeLabel(mode: CoachMode): string {
  return COACH_MODE_OPTIONS.find(option => option.id === mode)?.label ?? 'Comprehensive Coach';
}

export function getCoachModeImage(mode: CoachMode): number {
  return COACH_MODE_OPTIONS.find(option => option.id === mode)?.image ?? COACH_MODE_OPTIONS[COACH_MODE_OPTIONS.length - 1].image;
}
