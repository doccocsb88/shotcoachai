import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows, typography } from '../../constants/theme';
import { AnalysisResult, getStoredGenerationUri } from '../../models/analysis';
import { UserManager } from '../../services/user/UserManager';

interface Props {
  result: AnalysisResult;
  onBack: () => void;
  onOpenPaywall: () => void;
  onSelectSuggestion: (suggestionIndex: number) => void;
}

export function AnalysisResultScreen({ result, onBack, onOpenPaywall, onSelectSuggestion }: Props) {
  const canUseSuggestion = (index: number) => {
    return Boolean(getStoredGenerationUri(result, index)) || UserManager.canUseSuggestion(index);
  };

  const handleSelectSuggestion = (index: number) => {
    if (!canUseSuggestion(index)) {
      onOpenPaywall();
      return;
    }
    onSelectSuggestion(index);
  };

  return (
    <Screen scroll={false}>
      <View style={styles.analysisRoot}>
        <ScreenNavBar title="Analysis Result" leadingLabel="Done" onLeadingPress={onBack} />

        <ScrollView
          style={styles.analysisScroll}
          contentContainerStyle={styles.analysisScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assessment</Text>
            <Text style={styles.body}>{result.overallAssessment}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Creative Direction</Text>
            {result.suggestions.map((suggestion, index) => {
              const hasSavedEdit = Boolean(getStoredGenerationUri(result, index));
              const isLocked = !canUseSuggestion(index);
              return (
                <Pressable
                  key={index}
                  onPress={() => handleSelectSuggestion(index)}
                  style={[
                    styles.suggestionCard,
                    isLocked && styles.suggestionCardLocked
                  ]}
                >
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <View style={styles.suggestionHeaderRight}>
                      {isLocked ? (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumBadgeIcon}>★</Text>
                        </View>
                      ) : null}
                      {hasSavedEdit ? <Text style={styles.savedBadge}>Saved</Text> : null}
                    </View>
                  </View>
                  <Text style={styles.suggestionConcept}>{suggestion.concept}</Text>
                  {(suggestion.composition ?? '').length > 0 ? (
                    <Text style={styles.suggestionMeta}>
                      <Text style={styles.suggestionMetaLabel}>Composition: </Text>
                      {suggestion.composition}
                    </Text>
                  ) : null}
                  {(suggestion.camera_angle ?? '').length > 0 ? (
                    <Text style={styles.suggestionMeta}>
                      <Text style={styles.suggestionMetaLabel}>Camera: </Text>
                      {suggestion.camera_angle}
                    </Text>
                  ) : null}
                  <View style={styles.changesList}>
                    {suggestion.changes.map((change, cIndex) => (
                      <Text key={cIndex} style={styles.changeItem}>
                        • {change}
                      </Text>
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  analysisRoot: {
    backgroundColor: colors.background,
    flex: 1,
    paddingTop: Platform.select({ android: StatusBar.currentHeight ?? 0, ios: 0 })
  },
  analysisScroll: {
    flex: 1
  },
  analysisScrollContent: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 8
  },
  section: {
    gap: 10,
    marginTop: 18
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800'
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  suggestionCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    ...shadows.soft
  },
  suggestionCardLocked: {
    opacity: 0.68
  },
  suggestionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  suggestionHeaderRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  savedBadge: {
    backgroundColor: 'rgba(47, 211, 155, 0.18)',
    borderRadius: radius.sm,
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  premiumBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30
  },
  premiumBadgeIcon: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900'
  },
  suggestionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8
  },
  suggestionConcept: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8
  },
  suggestionMeta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  suggestionMetaLabel: {
    color: colors.text,
    fontWeight: '800'
  },
  changesList: {
    gap: 6,
    marginTop: 8
  },
  changeItem: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
});
