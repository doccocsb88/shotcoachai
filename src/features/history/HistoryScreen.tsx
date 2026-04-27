import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors } from '../../constants/theme';
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
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <PrimaryButton title="Back" onPress={onBack} variant="ghost" />
        </View>

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
              return (
                <Pressable onPress={() => onOpenResult(item)} style={styles.row}>
                  <Image source={{ uri: item.originalImageUri }} style={styles.thumb} />
                  <View style={styles.rowText}>
                    <Text style={styles.summary} numberOfLines={2}>{item.overallAssessment}</Text>
                    <Text style={styles.date}>
                      {new Date(item.createdAt).toLocaleString()}
                      {savedEditCount > 0
                        ? ` · ${savedEditCount} saved edit${savedEditCount === 1 ? '' : 's'}`
                        : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  },
  list: {
    gap: 12,
    paddingBottom: 32,
    paddingTop: 20
  },
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12
  },
  thumb: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    height: 76,
    width: 58
  },
  rowText: {
    flex: 1,
    justifyContent: 'center'
  },
  summary: {
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
