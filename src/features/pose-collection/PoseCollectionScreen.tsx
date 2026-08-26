import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MagnifyingGlass } from 'phosphor-react-native';

import { AppScreenHeader } from '../../components/common/AppScreenHeader';
import { Screen } from '../../components/common/Screen';
import { colors, radius } from '../../constants/theme';
import { Pose } from '../../models/pose';
import { CollectionCard } from './components/CollectionCard';
import { PoseSearchResultCard } from './components/PoseSearchResultCard';
import { getAllCollections, getCollectionTitle, getPoseCountLabel, searchGlobalPoses } from './poseLibrary';

interface Props {
  onBack: () => void;
  onOpenCollection: (collectionId: string) => void;
  onOpenPose: (pose: Pose) => void;
}

type CollectionKindFilter = 'all' | 'girl' | 'couple';

const KIND_FILTERS: Array<{ id: CollectionKindFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'girl', label: 'Solo' },
  { id: 'couple', label: 'Couple' }
];

function kindLabel(kind: string): string {
  if (kind === 'couple') return 'Couple';
  if (kind === 'girl') return 'Solo';
  return 'Mixed';
}

export function PoseCollectionScreen({ onBack, onOpenCollection, onOpenPose }: Props) {
  const [searchText, setSearchText] = useState('');
  const [selectedKind, setSelectedKind] = useState<CollectionKindFilter>('all');
  const collections = getAllCollections();
  const isGlobalSearch = searchText.trim().length > 0;

  const globalPoseResults = useMemo(
    () => searchGlobalPoses(searchText, selectedKind),
    [searchText, selectedKind]
  );

  const filteredCollections = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return collections.filter(collection => {
      if (selectedKind !== 'all' && collection.kind !== selectedKind) return false;
      if (!normalizedSearch) return true;
      const haystack = [collection.title, collection.subtitle, collection.kind, collection.id]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [collections, searchText, selectedKind]);

  const totalPoses = filteredCollections.reduce((sum, collection) => sum + collection.poseCount, 0);

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <AppScreenHeader title="Pose Collections" onBack={onBack} />
        <View style={styles.searchWrap}>
          <MagnifyingGlass size={18} color={colors.textMuted} weight="bold" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search poses or collections"
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
          {KIND_FILTERS.map(filter => {
            const selected = filter.id === selectedKind;
            return (
              <Pressable
                key={filter.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setSelectedKind(filter.id)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.countLabel}>
          {isGlobalSearch
            ? `${globalPoseResults.length} poses across collections`
            : `${filteredCollections.length} collections · ${getPoseCountLabel(totalPoses)}`}
        </Text>

        {isGlobalSearch ? (
          <FlatList
            data={globalPoseResults}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.empty}>No poses match your search.</Text>}
            renderItem={({ item }) => (
              <PoseSearchResultCard
                pose={item}
                collectionTitle={getCollectionTitle(item.collectionId ?? '')}
                onPress={() => onOpenPose(item)}
                style={styles.gridItem}
              />
            )}
          />
        ) : (
          <FlatList
            data={filteredCollections}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.empty}>No collections match these filters.</Text>}
            renderItem={({ item }) => (
              <CollectionCard
                title={item.title}
                subtitle={item.subtitle}
                poseCount={item.poseCount}
                coverImage={item.coverImage}
                kindLabel={kindLabel(item.kind)}
                onPress={() => onOpenCollection(item.id)}
                style={styles.gridItem}
              />
            )}
          />
        )}
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
