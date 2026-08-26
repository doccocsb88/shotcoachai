import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../../../components/common/PrimaryButton';
import { CrownLockIcon } from '../../../components/icons/CrownLockIcon';
import { colors, radius, shadows } from '../../../constants/theme';
import { PhotoAiTool } from '../../../models/photoAiTool';
import { toolPromptTags } from '../photoPreviewConfig';
import { QuickSuggestionPicker } from './QuickSuggestionPicker';

interface InstructionEditorStepProps {
  tool: PhotoAiTool;
  instruction: string;
  selectedQuickSuggestion: string | null;
  isToolLocked: boolean;
  onInstructionChange: (value: string) => void;
  onSelectQuickSuggestion: (suggestion: string) => void;
  onGenerate: () => void;
}

export function InstructionEditorStep({
  tool,
  instruction,
  selectedQuickSuggestion,
  isToolLocked,
  onInstructionChange,
  onSelectQuickSuggestion,
  onGenerate
}: InstructionEditorStepProps) {
  return (
    <>
      <ScrollView
        contentContainerStyle={styles.instructionsContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.instructionsIntro}>
          <Text style={styles.instructionsDetail}>{tool.detail}</Text>
          <View style={styles.toolTagRow}>
            {toolPromptTags[tool.id].map(tag => (
              <Text key={tag} style={styles.toolTag}>{tag}</Text>
            ))}
          </View>
        </View>

        <Text style={styles.fieldLabel}>Quick suggestions</Text>
        <QuickSuggestionPicker
          selectedSuggestion={selectedQuickSuggestion}
          tool={tool}
          onSelect={onSelectQuickSuggestion}
        />

        <Text style={styles.fieldLabel}>Or describe it</Text>
        <View style={styles.inputWrap}>
          <TextInput
            multiline
            maxLength={200}
            onChangeText={onInstructionChange}
            placeholder={tool.instructionPlaceholder ?? 'Describe what you want to achieve...'}
            placeholderTextColor={colors.textTertiary}
            style={styles.instructionInput}
            textAlignVertical="top"
            value={instruction}
          />
          <Text style={styles.inputCounter}>{instruction.length}/200</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <PrimaryButton
          title="Generate"
          icon={isToolLocked ? <CrownLockIcon color={colors.white} size={20} /> : undefined}
          onPress={onGenerate}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  instructionsContent: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 18
  },
  instructionsIntro: {
    marginBottom: 12
  },
  instructionsDetail: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'center'
  },
  toolTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center'
  },
  toolTag: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 4
  },
  inputWrap: {
    backgroundColor: '#F7F8FA',
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: radius.xl,
    borderWidth: 1,
    minHeight: 150,
    padding: 16,
    ...shadows.soft
  },
  instructionInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    minHeight: 104
  },
  inputCounter: {
    alignSelf: 'flex-end',
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '800'
  },
  actions: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 20,
    paddingTop: 10
  }
});
