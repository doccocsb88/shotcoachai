import { useRef } from 'react';
import { Alert, Animated, FlatList, Image, PanResponder, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows } from '../../constants/theme';
import { AnalysisResult, countStoredSuggestionEdits } from '../../models/analysis';

interface Props {
  onBack: () => void;
  onOpenResult: (result: AnalysisResult) => void;
}

export function HistoryScreen({ onBack, onOpenResult }: Props) {
  const recentResults = useAnalysisStore(state => state.recentResults);
  const removeRecentResult = useAnalysisStore(state => state.removeRecentResult);

  const confirmDelete = (item: AnalysisResult) => {
    Alert.alert(
      'Delete history item?',
      'This saved result will be removed from your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeRecentResult(item.analysisId);
          }
        }
      ]
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <ScreenNavBar title="History" leadingLabel="Back" onLeadingPress={onBack} />
        <View style={styles.bodyWrap}>
          {recentResults.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No analyses yet</Text>
              <Text style={styles.emptyBody}>Analyze a photo and it will appear here.</Text>
            </View>
          ) : (
            <FlatList
              data={recentResults}
              keyExtractor={item => item.analysisId}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <SwipeableHistoryRow
                  item={item}
                  onDelete={() => confirmDelete(item)}
                  onOpen={() => onOpenResult(item)}
                />
              )}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

function SwipeableHistoryRow({
  item,
  onDelete,
  onOpen
}: {
  item: AnalysisResult;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);
  const deleteRequested = useRef(false);
  const deleteWidth = 92;
  const savedEditCount = countStoredSuggestionEdits(item);
  const selectedSuggestion =
    typeof item.selectedSuggestionIndex === 'number'
      ? item.suggestions[item.selectedSuggestionIndex]
      : undefined;
  const thumbnailUri = item.generatedImageUri ?? item.originalImageUri;
  const title = selectedSuggestion?.title ?? item.overallAssessment;
  const subtitle = selectedSuggestion?.concept ?? item.overallAssessment;

  const animateTo = (toValue: number) => {
    currentX.current = toValue;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 22
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
      },
      onPanResponderMove: (_, gesture) => {
        const nextX = Math.max(-deleteWidth * 1.35, Math.min(0, currentX.current + gesture.dx));
        translateX.setValue(nextX);
      },
      onPanResponderRelease: (_, gesture) => {
        const finalX = currentX.current + gesture.dx;
        if (finalX <= -deleteWidth * 1.15 && !deleteRequested.current) {
          deleteRequested.current = true;
          animateTo(0);
          onDelete();
          return;
        }
        const shouldOpen = finalX < -deleteWidth / 2 || gesture.vx < -0.6;
        animateTo(shouldOpen ? -deleteWidth : 0);
      },
      onPanResponderTerminate: () => {
        animateTo(0);
      }
    })
  ).current;

  const handleDelete = () => {
    deleteRequested.current = true;
    animateTo(0);
    onDelete();
  };

  return (
    <View style={styles.swipeRow}>
      <View style={styles.deleteAction}>
        <Pressable
          accessibilityLabel="Delete history item"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[
          styles.swipeContent,
          {
            transform: [{ translateX }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={onOpen} style={styles.row}>
          <Image source={{ uri: thumbnailUri }} style={styles.thumb} />
          <View style={styles.rowText}>
            <Text style={styles.summary} numberOfLines={1}>{title}</Text>
            <Text style={styles.direction} numberOfLines={1}>{subtitle}</Text>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleString()}
              {savedEditCount > 0 ? ' · saved edit' : ''}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.select({ android: StatusBar.currentHeight ?? 0, ios: 0 })
  },
  bodyWrap: {
    flex: 1,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  list: {
    gap: 12,
    paddingBottom: 32,
    paddingTop: 12
  },
  swipeRow: {
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative'
  },
  swipeContent: {
    backgroundColor: colors.background,
    borderRadius: radius.md
  },
  deleteAction: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    overflow: 'hidden'
  },
  deleteButton: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 92
  },
  deleteText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900'
  },
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    ...shadows.soft
  },
  thumb: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    height: 76,
    width: 58
  },
  rowText: {
    flex: 1,
    justifyContent: 'center'
  },
  summary: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 2
  },
  direction: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 4
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6
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
  pressed: {
    opacity: 0.72
  }
});
