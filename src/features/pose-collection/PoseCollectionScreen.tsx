import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MagnifyingGlass } from 'phosphor-react-native';

import { AppScreenHeader } from '../../components/common/AppScreenHeader';
import { Screen } from '../../components/common/Screen';
import { colors, radius } from '../../constants/theme';
import { Pose, PoseBodyPosition, PoseFraming, PoseLocationTab, PoseSubjectCount } from '../../models/pose';
import { PoseCard } from './components/PoseCard';
import { getPoseCountLabel, getVisibleLocationTabs, queryPoses } from './poseLibrary';

interface Props {
  onBack: () => void;
  onOpenPose: (pose: Pose) => void;
}

const LOCATION_LABELS: Record<PoseLocationTab, string> = {
  all: 'All',
  cafe: 'Cafe',
  beach: 'Beach',
  street: 'Street',
  nature: 'Nature',
  stores: 'Stores'
};

type QuickFilterId = 'solo' | 'couple' | 'full_body' | 'sitting' | 'candid';

const QUICK_FILTERS: Array<{ id: QuickFilterId; label: string }> = [
  { id: 'solo', label: 'Solo' },
  { id: 'couple', label: 'Couple' },
  { id: 'full_body', label: 'Full body' },
  { id: 'sitting', label: 'Sitting' },
  { id: 'candid', label: 'Candid' }
];

export function PoseCollectionScreen({ onBack, onOpenPose }: Props) {
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PoseLocationTab>('all');
  const [activeQuickFilters, setActiveQuickFilters] = useState<QuickFilterId[]>([]);
  const locationTabs = getVisibleLocationTabs();

  const subjectCount = useMemo<PoseSubjectCount[] | undefined>(() => {
    const counts: PoseSubjectCount[] = [];
    if (activeQuickFilters.includes('solo')) counts.push(1);
    if (activeQuickFilters.includes('couple')) counts.push(2);
    return counts.length ? counts : undefined;
  }, [activeQuickFilters]);

  const framing = useMemo<PoseFraming[] | undefined>(() => {
    return activeQuickFilters.includes('full_body') ? ['full_body'] : undefined;
  }, [activeQuickFilters]);

  const bodyPositions = useMemo<PoseBodyPosition[] | undefined>(() => {
    return activeQuickFilters.includes('sitting') ? ['sitting'] : undefined;
  }, [activeQuickFilters]);

  const poses = useMemo(
    () =>
      queryPoses({
        location: selectedLocation,
        searchText,
        subjectCount,
        framing,
        bodyPositions,
        styles: activeQuickFilters.includes('candid') ? ['candid'] : undefined
      }),
    [activeQuickFilters, bodyPositions, framing, searchText, selectedLocation, subjectCount]
  );

  const toggleQuickFilter = (filterId: QuickFilterId) => {
    setActiveQuickFilters(current =>
      current.includes(filterId) ? current.filter(id => id !== filterId) : [...current, filterId]
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <AppScreenHeader title="Pose Collection" onBack={onBack} />
        <View style={styles.searchWrap}>
          <MagnifyingGlass size={18} color={colors.textMuted} weight="bold" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search poses"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView
          horizontal
          style={styles.tabScroller}
          contentContainerStyle={styles.tabRow}
          showsHorizontalScrollIndicator={false}
        >
          {locationTabs.map(locationTab => {
            const selected = locationTab === selectedLocation;
            return (
              <Pressable
                key={locationTab}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setSelectedLocation(locationTab)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                  {LOCATION_LABELS[locationTab]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.chipRow}>
          {QUICK_FILTERS.map(filter => {
            const selected = activeQuickFilters.includes(filter.id);
            return (
              <Pressable
                key={filter.id}
                onPress={() => toggleQuickFilter(filter.id)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.countLabel}>{getPoseCountLabel(poses.length)}</Text>

        <FlatList
          data={poses}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>No poses match these filters.</Text>}
          renderItem={({ item }) => (
            <PoseCard pose={item} onPress={() => onOpenPose(item)} style={styles.gridItem} />
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600'
  },
  tabScroller: {
    flexGrow: 0,
    flexShrink: 0
  },
  tabRow: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14
  },
  tab: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  tabSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tabLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  tabLabelSelected: {
    color: colors.white
  },
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12
  },
  chip: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  chipLabelSelected: {
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
