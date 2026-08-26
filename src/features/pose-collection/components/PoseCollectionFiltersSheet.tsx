import { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../../constants/theme';
import { PoseLocationTab } from '../../../models/pose';

const LOCATION_LABELS: Record<PoseLocationTab, string> = {
  all: 'All locations',
  cafe: 'Cafe',
  beach: 'Beach',
  street: 'Street',
  nature: 'Nature',
  stores: 'Stores'
};

export type PoseQuickFilterId = 'full_body' | 'sitting' | 'standing' | 'easy';

const QUICK_FILTERS: Array<{ id: PoseQuickFilterId; label: string }> = [
  { id: 'full_body', label: 'Full body' },
  { id: 'sitting', label: 'Sitting' },
  { id: 'standing', label: 'Standing' },
  { id: 'easy', label: 'Easy' }
];

interface Props {
  visible: boolean;
  locationTabs: PoseLocationTab[];
  selectedLocation: PoseLocationTab;
  activeQuickFilters: PoseQuickFilterId[];
  onClose: () => void;
  onSelectLocation: (location: PoseLocationTab) => void;
  onToggleQuickFilter: (filterId: PoseQuickFilterId) => void;
  onClearAll: () => void;
}

export function PoseCollectionFiltersSheet({
  visible,
  locationTabs,
  selectedLocation,
  activeQuickFilters,
  onClose,
  onSelectLocation,
  onToggleQuickFilter,
  onClearAll
}: Props) {
  const translateY = useRef(new Animated.Value(420)).current;

  const activeFilterCount = useMemo(() => {
    let count = selectedLocation !== 'all' ? 1 : 0;
    count += activeQuickFilters.length;
    return count;
  }, [activeQuickFilters.length, selectedLocation]);

  const closeWithAnimation = () => {
    Animated.timing(translateY, {
      duration: 180,
      toValue: 420,
      useNativeDriver: true
    }).start(onClose);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          translateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 90 || gestureState.vy > 0.9) {
            closeWithAnimation();
            return;
          }
          Animated.spring(translateY, {
            damping: 18,
            stiffness: 180,
            toValue: 0,
            useNativeDriver: true
          }).start();
        }
      }),
    [translateY]
  );

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(420);
    Animated.spring(translateY, {
      damping: 20,
      stiffness: 180,
      toValue: 0,
      useNativeDriver: true
    }).start();
  }, [translateY, visible]);

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={closeWithAnimation} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Close filters" accessibilityRole="button" onPress={closeWithAnimation} style={styles.backdrop} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Filters</Text>
              <Text style={styles.subtitle}>
                {activeFilterCount === 0 ? 'No filters applied' : `${activeFilterCount} active`}
              </Text>
            </View>
            <Pressable onPress={onClearAll} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear all</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.chipRow}>
              {locationTabs.map(locationTab => {
                const selected = locationTab === selectedLocation;
                return (
                  <Pressable
                    key={locationTab}
                    onPress={() => onSelectLocation(locationTab)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                      {LOCATION_LABELS[locationTab]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.sectionTitle}>Pose type</Text>
            <View style={styles.chipRow}>
              {QUICK_FILTERS.map(filter => {
                const selected = activeQuickFilters.includes(filter.id);
                return (
                  <Pressable
                    key={filter.id}
                    onPress={() => onToggleQuickFilter(filter.id)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{filter.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <Pressable onPress={closeWithAnimation} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Show results</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function countActivePoseFilters(
  selectedLocation: PoseLocationTab,
  activeQuickFilters: PoseQuickFilterId[]
): number {
  return (selectedLocation !== 'all' ? 1 : 0) + activeQuickFilters.length;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 27, 52, 0.42)'
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '72%',
    paddingBottom: spacing.lg
  },
  dragArea: {
    alignItems: 'center',
    paddingTop: 10
  },
  handle: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 4,
    width: 40
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  clearButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800'
  },
  content: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
    marginTop: 8
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  chipLabelSelected: {
    color: colors.primary
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800'
  }
});
