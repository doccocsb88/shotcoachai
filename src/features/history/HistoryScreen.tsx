import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

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
              renderItem={({ item }) => {
                const savedEditCount = countStoredSuggestionEdits(item);
                const selectedSuggestion =
                  typeof item.selectedSuggestionIndex === 'number'
                    ? item.suggestions[item.selectedSuggestionIndex]
                    : undefined;
                const thumbnailUri = item.generatedImageUri ?? item.originalImageUri;
                const title = selectedSuggestion?.title ?? item.overallAssessment;
                const subtitle = selectedSuggestion?.concept ?? item.overallAssessment;
                return (
                  <Pressable onPress={() => onOpenResult(item)} style={styles.row}>
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
                );
              }}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0
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
  }
});
