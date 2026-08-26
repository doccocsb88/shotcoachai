import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Funnel, MagnifyingGlass } from 'phosphor-react-native';

import { AppScreenHeader } from '../../components/common/AppScreenHeader';
import { Screen } from '../../components/common/Screen';
import { colors, radius } from '../../constants/theme';
import { Pose, PoseLocationTab } from '../../models/pose';
import {
  countActivePoseFilters,
  PoseCollectionFiltersSheet,
  PoseQuickFilterId
} from './components/PoseCollectionFiltersSheet';
import { PoseCard } from './components/PoseCard';
import { getCollectionById, getPoseCountLabel } from './poseCollectionCatalog';

interface Props {
  collectionId: string;
  initialPoseId?: string | null;
  onInitialPoseHandled?: () => void;
  onBack: () => void;
  onOpenPose: (pose: Pose) => void;
}

function matchesSearch(pose: Pose, searchText: string): boolean {
  const normalizedSearch = searchText.trim().toLowerCase();
  if (!normalizedSearch) return true;
  const haystack = [
    pose.title,
    pose.subtitle,
    pose.howToPose,
    pose.primaryLocation,
    pose.sceneCategory,
    pose.difficulty,
    ...(pose.mood ?? []),
    ...pose.searchTerms
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(normalizedSearch);
}

export function PoseCollectionDetailScreen({
  collectionId,
  initialPoseId,
  onInitialPoseHandled,
  onBack,
  onOpenPose
}: Props) {
  const collection = getCollectionById(collectionId);
  const listRef = useRef<FlatList<Pose>>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PoseLocationTab>('all');
  const [activeQuickFilters, setActiveQuickFilters] = useState<PoseQuickFilterId[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [highlightedPoseId, setHighlightedPoseId] = useState<string | null>(initialPoseId ?? null);

  const locationTabs = useMemo<PoseLocationTab[]>(() => {
    if (!collection) return ['all'];
    const tabs: PoseLocationTab[] = ['all'];
    const locations: PoseLocationTab[] = ['cafe', 'beach', 'street', 'nature', 'stores'];
    locations.forEach(location => {
      if (collection.poses.some(pose => pose.primaryLocation === location)) {
        tabs.push(location);
      }
    });
    return tabs;
  }, [collection]);

  const poses = useMemo(() => {
    if (!collection) return [];
    return collection.poses.filter(pose => {
      if (selectedLocation !== 'all' && pose.primaryLocation !== selectedLocation) return false;
      if (!matchesSearch(pose, searchText)) return false;
      if (activeQuickFilters.includes('full_body') && pose.framing !== 'full_body') return false;
      if (activeQuickFilters.includes('sitting') && pose.bodyPosition !== 'sitting') return false;
      if (activeQuickFilters.includes('standing') && pose.bodyPosition !== 'standing') return false;
      if (activeQuickFilters.includes('easy') && pose.difficulty !== 'easy') return false;
      return true;
    });
  }, [activeQuickFilters, collection, searchText, selectedLocation]);

  const activeFilterCount = countActivePoseFilters(selectedLocation, activeQuickFilters);

  const toggleQuickFilter = (filterId: PoseQuickFilterId) => {
    setActiveQuickFilters(current =>
      current.includes(filterId) ? current.filter(id => id !== filterId) : [...current, filterId]
    );
  };

  const clearAllFilters = () => {
    setSelectedLocation('all');
    setActiveQuickFilters([]);
  };

  useEffect(() => {
    if (!initialPoseId || poses.length === 0) return;

    const targetIndex = poses.findIndex(pose => pose.id === initialPoseId);
    if (targetIndex < 0) {
      onInitialPoseHandled?.();
      return;
    }

    const scrollTimer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        animated: true,
        index: targetIndex,
        viewPosition: 0.25
      });
      onInitialPoseHandled?.();
    }, 120);

    return () => clearTimeout(scrollTimer);
  }, [initialPoseId, onInitialPoseHandled, poses]);

  if (!collection) {
    return (
      <Screen scroll={false}>
        <View style={styles.root}>
          <AppScreenHeader title="Collection" onBack={onBack} />
          <Text style={styles.empty}>Collection not found.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <AppScreenHeader title={collection.title} onBack={onBack} />
        <Text style={styles.collectionSubtitle}>{collection.subtitle}</Text>

        <View style={styles.toolbar}>
          <View style={styles.searchWrap}>
            <MagnifyingGlass size={18} color={colors.textMuted} weight="bold" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search poses in collection"
              placeholderTextColor={colors.textTertiary}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            onPress={() => setFiltersVisible(true)}
            style={styles.filterButton}
          >
            <Funnel size={18} color={activeFilterCount > 0 ? colors.primary : colors.textMuted} weight="bold" />
            <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
              {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.countLabel}>{getPoseCountLabel(poses.length)}</Text>

        <FlatList
          ref={listRef}
          data={poses}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            listRef.current?.scrollToOffset({
              animated: true,
              offset: averageItemLength * Math.floor(index / 2)
            });
          }}
          ListEmptyComponent={<Text style={styles.empty}>No poses match these filters.</Text>}
          renderItem={({ item }) => (
            <PoseCard
              pose={item}
              isHighlighted={item.id === highlightedPoseId}
              onPress={() => {
                setHighlightedPoseId(null);
                onOpenPose(item);
              }}
              style={styles.gridItem}
            />
          )}
        />
      </View>

      <PoseCollectionFiltersSheet
        visible={filtersVisible}
        locationTabs={locationTabs}
        selectedLocation={selectedLocation}
        activeQuickFilters={activeQuickFilters}
        onClose={() => setFiltersVisible(false)}
        onSelectLocation={setSelectedLocation}
        onToggleQuickFilter={toggleQuickFilter}
        onClearAll={clearAllFilters}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  collectionSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: -4,
    paddingHorizontal: 20
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 10
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600'
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  filterButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800'
  },
  filterButtonTextActive: {
    color: colors.primary
  },
  countLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 12
  },
  grid: {
    paddingBottom: 24,
    paddingHorizontal: 12,
    paddingTop: 12
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12
  },
  gridItem: {
    width: '48%'
  },
  empty: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    paddingTop: 40,
    textAlign: 'center'
  }
});
