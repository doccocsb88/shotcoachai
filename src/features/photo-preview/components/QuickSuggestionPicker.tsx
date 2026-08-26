import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows } from '../../../constants/theme';
import { PhotoAiTool } from '../../../models/photoAiTool';
import {
  compositionSuggestionIconSources,
  enhanceSuggestionIconSources
} from '../photoPreviewConfig';

interface QuickSuggestionPickerProps {
  tool: PhotoAiTool;
  selectedSuggestion: string | null;
  onSelect: (suggestion: string) => void;
}

export function QuickSuggestionPicker({
  tool,
  selectedSuggestion,
  onSelect
}: QuickSuggestionPickerProps) {
  const suggestions = tool.quickSuggestions ?? [];

  if (tool.id === 'enhance_photo') {
    return (
      <View style={styles.compositionSuggestionGrid}>
        {suggestions.map(suggestion => {
          const selected = selectedSuggestion === suggestion;
          const iconSource = enhanceSuggestionIconSources[suggestion];
          return (
            <Pressable
              accessibilityRole="button"
              key={suggestion}
              onPress={() => onSelect(suggestion)}
              style={({ pressed }) => [
                styles.compositionSuggestionCard,
                selected && styles.compositionSuggestionCardSelected,
                pressed && styles.pressed
              ]}
            >
              {iconSource ? (
                <Image source={iconSource} style={styles.compositionSuggestionIcon} resizeMode="contain" />
              ) : null}
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                numberOfLines={1}
                style={[
                  styles.compositionSuggestionText,
                  selected && styles.compositionSuggestionTextSelected
                ]}
              >
                {suggestion}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (tool.id === 'better_composition') {
    return (
      <View style={styles.compositionSuggestionGrid}>
        {suggestions.map(suggestion => {
          const selected = selectedSuggestion === suggestion;
          const iconSource = compositionSuggestionIconSources[suggestion];
          return (
            <Pressable
              accessibilityRole="button"
              key={suggestion}
              onPress={() => onSelect(suggestion)}
              style={({ pressed }) => [
                styles.compositionSuggestionCard,
                selected && styles.compositionSuggestionCardSelected,
                pressed && styles.pressed
              ]}
            >
              {iconSource ? (
                <Image source={iconSource} style={styles.compositionSuggestionIcon} resizeMode="contain" />
              ) : null}
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                numberOfLines={1}
                style={[
                  styles.compositionSuggestionText,
                  selected && styles.compositionSuggestionTextSelected
                ]}
              >
                {suggestion}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.quickSuggestionGrid}>
      {suggestions.map(suggestion => {
        const selected = selectedSuggestion === suggestion;
        return (
          <Pressable
            accessibilityRole="button"
            key={suggestion}
            onPress={() => onSelect(suggestion)}
            style={({ pressed }) => [
              styles.quickSuggestion,
              selected && styles.quickSuggestionSelected,
              pressed && styles.pressed
            ]}
          >
            <Text style={[styles.quickSuggestionText, selected && styles.quickSuggestionTextSelected]}>
              {suggestion}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  compositionSuggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
  },
  compositionSuggestionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '48%',
    ...shadows.soft
  },
  compositionSuggestionCardSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  compositionSuggestionIcon: {
    borderRadius: 10,
    height: 38,
    marginRight: 7,
    width: 38
  },
  compositionSuggestionText: {
    color: colors.text,
    flex: 1,
    fontSize: 11.5,
    fontWeight: '900',
    lineHeight: 14
  },
  compositionSuggestionTextSelected: {
    color: colors.primary
  },
  quickSuggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  quickSuggestion: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  quickSuggestionSelected: {
    backgroundColor: '#E8F4FF',
    borderColor: '#E8F4FF'
  },
  quickSuggestionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800'
  },
  quickSuggestionTextSelected: {
    color: colors.primary
  },
  pressed: {
    opacity: 0.72
  }
});
