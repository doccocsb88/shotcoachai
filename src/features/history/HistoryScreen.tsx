import { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows } from '../../constants/theme';
import { AnalysisResult, FlowType, getFlowType } from '../../models/analysis';
import { CheckCircleIcon, CircleIcon, DocumentIcon, SlidersIcon, SparklesIcon } from '../../components/icons/ResultActionIcons';

interface Props {
  onBack: () => void;
  onOpenResult: (result: AnalysisResult) => void;
}

const TABS: { id: FlowType; label: string; icon: (props: { size: number; color: string }) => JSX.Element }[] = [
  { id: 'aiCoach', label: 'AI Coach', icon: SparklesIcon },
  { id: 'editingTool', label: 'Editing Tools', icon: SlidersIcon },
  { id: 'photoRecipe', label: 'Photo Receipt', icon: DocumentIcon },
];

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GRID_SPACING = 8;
const GRID_PADDING = 16;
const CARD_WIDTH = (width - (GRID_PADDING * 2) - (GRID_SPACING * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

export function HistoryScreen({ onBack, onOpenResult }: Props) {
  const recentResults = useAnalysisStore(state => state.recentResults);
  const removeRecentResult = useAnalysisStore(state => state.removeRecentResult);

  const [activeTab, setActiveTab] = useState<FlowType>('aiCoach');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredResults = useMemo(() => {
    return recentResults.filter(r => getFlowType(r) === activeTab);
  }, [recentResults, activeTab]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleTrailingPress = useCallback(() => {
    if (isEditMode) {
      setIsEditMode(false);
      setSelectedIds(new Set());
    } else {
      setIsEditMode(true);
    }
  }, [isEditMode]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete selected items?',
      `Are you sure you want to delete ${selectedIds.size} item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedIds.forEach(id => removeRecentResult(id));
            setIsEditMode(false);
            setSelectedIds(new Set());
          }
        }
      ]
    );
  }, [selectedIds, removeRecentResult]);

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <ScreenNavBar 
          title="History" 
          leadingLabel="Back" 
          onLeadingPress={onBack} 
          trailingLabel={filteredResults.length > 0 ? (isEditMode ? 'Cancel' : 'Edit') : undefined}
          trailingColor={isEditMode ? colors.textMuted : colors.primary}
          onTrailingPress={handleTrailingPress}
        />
        
        {/* Tab Bar */}
        <View style={styles.tabContainer}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => {
                  setActiveTab(tab.id);
                  if (isEditMode) {
                    setIsEditMode(false);
                    setSelectedIds(new Set());
                  }
                }}
              >
                <Icon size={16} color={isActive ? colors.primary : colors.textMuted} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Grid */}
        <View style={styles.bodyWrap}>
          {filteredResults.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No analyses yet</Text>
              <Text style={styles.emptyBody}>Results for this category will appear here.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredResults}
              keyExtractor={item => item.analysisId}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={styles.list}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={({ item }) => (
                <HistoryGridItem
                  item={item}
                  isEditMode={isEditMode}
                  isSelected={selectedIds.has(item.analysisId)}
                  onToggleSelection={() => toggleSelection(item.analysisId)}
                  onOpen={() => onOpenResult(item)}
                />
              )}
            />
          )}
        </View>
        
        {/* Floating Action Button */}
        {isEditMode && selectedIds.size > 0 && (
          <View style={styles.fabContainer}>
            <Pressable style={styles.fab} onPress={confirmDelete}>
              <Text style={styles.fabText}>Delete {selectedIds.size} items</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Screen>
  );
}

function HistoryGridItem({
  item,
  isEditMode,
  isSelected,
  onToggleSelection,
  onOpen
}: {
  item: AnalysisResult;
  isEditMode: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
  onOpen: () => void;
}) {
  const thumbnailUri = item.generatedImageUri ?? item.originalImageUri;
  const dateStr = new Date(item.createdAt).toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <Pressable
      onPress={isEditMode ? onToggleSelection : onOpen}
      style={[styles.card, isSelected && styles.cardSelected]}
    >
      <Image source={{ uri: thumbnailUri }} style={styles.cardImage} />
      
      <View style={styles.cardOverlay}>
        <View style={styles.cardGradient} />
        <Text style={styles.cardDate} numberOfLines={1}>{dateStr}</Text>
      </View>

      {isEditMode && (
        <View style={styles.selectionCircle}>
          {isSelected ? (
            <CheckCircleIcon size={24} color={colors.primary} />
          ) : (
            <CircleIcon size={24} color="#FFFFFF" />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.select({ android: (StatusBar.currentHeight || 24) + 16, ios: 0 }),
    position: 'relative'
  },
  bodyWrap: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 4
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surface
  },
  tabActive: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted
  },
  tabLabelActive: {
    color: colors.primary
  },
  list: {
    padding: GRID_PADDING,
    paddingBottom: 80 // Leave space for FAB
  },
  columnWrapper: {
    gap: GRID_SPACING,
    marginBottom: GRID_SPACING
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.35,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface
  },
  cardSelected: {
    opacity: 0.7
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 6
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardDate: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    zIndex: 1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 }
  },
  selectionCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 30
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center'
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  fab: {
    backgroundColor: colors.danger,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    ...shadows.button
  },
  fabText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16
  }
});
