import { ImageSourcePropType } from 'react-native';

export const POSE_LOCATION_TABS = ['all', 'cafe', 'beach', 'street', 'nature', 'stores'] as const;
export type PoseLocationTab = (typeof POSE_LOCATION_TABS)[number];
export type PoseLocation = Exclude<PoseLocationTab, 'all'>;

export type PoseSubjectCount = 1 | 2 | 3 | 'group';
export type PoseAgeApplicability = 'child' | 'teen' | 'adult' | 'older_adult' | 'all_ages';
export type PoseSubjectType = 'any' | 'feminine' | 'masculine' | 'neutral';
export type PoseStyle = 'casual' | 'candid' | 'elegant' | 'playful' | 'romantic' | 'editorial' | 'minimal';
export type PoseFraming = 'close_up' | 'half_body' | 'three_quarter' | 'full_body';
export type PoseBodyPosition = 'standing' | 'sitting' | 'walking' | 'leaning' | 'lying' | 'action';
export type PoseCameraAngle = 'eye_level' | 'low_angle' | 'high_angle' | 'side_angle' | 'over_shoulder';

export interface PoseAsset {
  source: ImageSourcePropType;
  assetKey: string;
}

export interface Pose {
  id: string;
  title: string;
  subtitle: string;
  primaryLocation: PoseLocation;
  subjectCount: PoseSubjectCount;
  ageApplicability: PoseAgeApplicability[];
  subjectTypes: PoseSubjectType[];
  styles: PoseStyle[];
  framing: PoseFraming;
  bodyPosition: PoseBodyPosition;
  cameraAngle: PoseCameraAngle;
  howToPose: string;
  cameraGuidance: string;
  browsingImage: PoseAsset;
  overlayImage?: PoseAsset;
  searchTerms: string[];
  isFeatured: boolean;
  sortOrder: number;
  status: 'draft' | 'published';
}

export interface PoseQuery {
  location?: PoseLocationTab;
  searchText?: string;
  subjectCount?: PoseSubjectCount[];
  subjectTypes?: PoseSubjectType[];
  styles?: PoseStyle[];
  framing?: PoseFraming[];
  bodyPositions?: PoseBodyPosition[];
  featuredOnly?: boolean;
}
