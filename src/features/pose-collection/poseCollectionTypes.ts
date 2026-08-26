import { Pose } from '../../models/pose';

export type PoseCollectionKind = 'girl' | 'couple' | 'other';

export interface PoseCollectionEntry extends Omit<Pose, 'browsingImage' | 'overlayImage'> {
  collectionId: string;
  poseId: string;
  browsingImageKey: string;
  overlayImageKey: string;
  difficulty: string;
  sceneCategory: string;
  mood: string[];
  rawMetadata: Record<string, unknown>;
}

export interface PoseCollection {
  id: string;
  title: string;
  kind: PoseCollectionKind;
  subtitle: string;
  poseCount: number;
  coverImageKey: string;
  sortOrder: number;
  poses: PoseCollectionEntry[];
}
