import { PhotoAiTool } from '../../models/photoAiTool';

export function buildDirectEditInstruction(
  tool: PhotoAiTool,
  instruction: string,
  selectedQuickSuggestion: string | null
): string {
  const rawInstruction = instruction.trim();
  const suggestionInstruction = selectedQuickSuggestion
    ? tool.quickSuggestionInstructions?.[selectedQuickSuggestion] ?? selectedQuickSuggestion
    : undefined;
  const labeledSuggestionInstruction = selectedQuickSuggestion && suggestionInstruction
    ? `${selectedQuickSuggestion}: ${suggestionInstruction}`
    : undefined;

  if (rawInstruction && rawInstruction !== selectedQuickSuggestion) {
    return rawInstruction;
  }

  return labeledSuggestionInstruction || rawInstruction || tool.detail;
}
