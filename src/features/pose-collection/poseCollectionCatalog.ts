import { ImageSourcePropType } from 'react-native';

import { Pose, PoseAsset } from '../../models/pose';
import { poseAssetMap } from './generated/poseAssetMap';
import { POSE_COLLECTIONS } from './generated/poseCollectionsData';
import { PoseCollection, PoseCollectionEntry } from './poseCollectionTypes';

export interface HydratedPoseCollection extends Omit<PoseCollection, 'coverImageKey' | 'poses'> {
  coverImage: PoseAsset;
  poses: Pose[];
}

function resolveAsset(assetKey: string): ImageSourcePropType {
  return poseAssetMap[assetKey] ?? { uri: assetKey };
}

function toPoseAsset(assetKey: string): PoseAsset {
  return {
    assetKey,
    source: resolveAsset(assetKey)
  };
}

function hydratePose(entry: PoseCollectionEntry): Pose {
  return {
    id: entry.id,
    title: entry.title,
    subtitle: entry.subtitle,
    primaryLocation: entry.primaryLocation,
    subjectCount: entry.subjectCount,
    ageApplicability: entry.ageApplicability,
    subjectTypes: entry.subjectTypes,
    styles: entry.styles,
    framing: entry.framing,
    bodyPosition: entry.bodyPosition,
    cameraAngle: entry.cameraAngle,
    howToPose: entry.howToPose,
    cameraGuidance: entry.cameraGuidance,
    browsingImage: toPoseAsset(entry.browsingImageKey),
    overlayImage: toPoseAsset(entry.overlayImageKey),
    searchTerms: entry.searchTerms,
    isFeatured: entry.isFeatured,
    sortOrder: entry.sortOrder,
    status: entry.status,
    collectionId: entry.collectionId,
    poseId: entry.poseId,
    difficulty: entry.difficulty,
    sceneCategory: entry.sceneCategory,
    mood: entry.mood,
    rawMetadata: entry.rawMetadata
  };
}

function hydrateCollection(collection: PoseCollection): HydratedPoseCollection {
  return {
    id: collection.id,
    title: collection.title,
    kind: collection.kind,
    subtitle: collection.subtitle,
    poseCount: collection.poseCount,
    sortOrder: collection.sortOrder,
    coverImage: toPoseAsset(collection.coverImageKey),
    poses: collection.poses.map(hydratePose)
  };
}

const hydratedCollections = POSE_COLLECTIONS.map(hydrateCollection);

export function getAllCollections(): HydratedPoseCollection[] {
  return hydratedCollections;
}

export function getCollectionById(collectionId: string): HydratedPoseCollection | undefined {
  return hydratedCollections.find(collection => collection.id === collectionId);
}

export function getAllPoses(): Pose[] {
  return hydratedCollections.flatMap(collection => collection.poses);
}

export function getPoseById(poseId: string): Pose | undefined {
  return getAllPoses().find(pose => pose.id === poseId);
}

export function getPosesForCollection(collectionId: string): Pose[] {
  return getCollectionById(collectionId)?.poses ?? [];
}

export function getCollectionTitle(collectionId: string): string {
  return getCollectionById(collectionId)?.title ?? collectionId;
}

export function getPoseCountLabel(count: number): string {
  return count === 1 ? '1 pose' : `${count} poses`;
}
