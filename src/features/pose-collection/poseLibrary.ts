import { Pose, PoseLocationTab, PoseQuery } from '../../models/pose';
import { POSE_CATALOG } from './poseCatalog';
import { YOUNG_WOMEN_POSE_CATALOG } from './poseCatalogYoungWomen';

function publishedPoses(): Pose[] {
  return [...POSE_CATALOG, ...YOUNG_WOMEN_POSE_CATALOG]
    .filter(pose => pose.status === 'published')
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function matchesSearch(pose: Pose, searchText: string): boolean {
  const normalizedSearch = searchText.trim().toLowerCase();
  if (!normalizedSearch) return true;

  const haystack = [
    pose.title,
    pose.subtitle,
    pose.howToPose,
    pose.primaryLocation,
    ...pose.searchTerms,
    ...pose.styles,
    ...pose.subjectTypes
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearch);
}

function includesIfRequested<T>(selected: T[] | undefined, value: T): boolean {
  if (!selected || selected.length === 0) return true;
  return selected.includes(value);
}

export function getPoseById(poseId: string): Pose | undefined {
  return publishedPoses().find(pose => pose.id === poseId);
}

export function getFeaturedPoses(limit = 6): Pose[] {
  return publishedPoses().filter(pose => pose.isFeatured).slice(0, limit);
}

export function queryPoses(query: PoseQuery = {}): Pose[] {
  const location = query.location ?? 'all';

  return publishedPoses().filter(pose => {
    if (query.featuredOnly && !pose.isFeatured) return false;
    if (location !== 'all' && pose.primaryLocation !== location) return false;
    if (!matchesSearch(pose, query.searchText ?? '')) return false;
    if (!includesIfRequested(query.subjectCount, pose.subjectCount)) return false;
    if (query.subjectTypes && query.subjectTypes.length > 0 && !pose.subjectTypes.some(type => query.subjectTypes?.includes(type) || type === 'any')) {
      return false;
    }
    if (query.styles && query.styles.length > 0 && !pose.styles.some(style => query.styles?.includes(style))) {
      return false;
    }
    if (!includesIfRequested(query.framing, pose.framing)) return false;
    if (!includesIfRequested(query.bodyPositions, pose.bodyPosition)) return false;
    return true;
  });
}

export function getVisibleLocationTabs(): PoseLocationTab[] {
  const poses = publishedPoses();
  const tabs: PoseLocationTab[] = ['all'];
  const locations: PoseLocationTab[] = ['cafe', 'beach', 'street', 'nature', 'stores'];
  locations.forEach(location => {
    if (poses.some(pose => pose.primaryLocation === location)) {
      tabs.push(location);
    }
  });
  return tabs;
}

export function getPoseCountLabel(count: number): string {
  return count === 1 ? '1 pose' : `${count} poses`;
}
