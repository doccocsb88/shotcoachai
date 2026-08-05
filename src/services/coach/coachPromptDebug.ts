import { CoachMode } from '../../core/store/analysisStore';
import { CoachPreferences } from '../../models/coachPreferences';
import { shouldDebugOpenAIFlow } from '../openai/debugOpenAIFlow';

const LOG_PREFIX = '[ShotCoach][Coach][prompt]';
const SEPARATOR = '─'.repeat(72);

export type CoachPromptStage =
  | 'direct-image-edit'
  | 'v2-analysis'
  | 'v2-directions'
  | 'v2-image-edit';

type LogCoachPromptInput = {
  stage: CoachPromptStage;
  coachMode?: CoachMode;
  coachPreferences?: CoachPreferences;
  userText?: string;
  prompt: string;
};

export function shouldLogCoachPrompts(): boolean {
  return shouldDebugOpenAIFlow();
}

export function logCoachPrompt(input: LogCoachPromptInput): void {
  if (!shouldLogCoachPrompts()) {
    return;
  }

  const { stage, coachMode, coachPreferences, userText, prompt } = input;
  const header = [
    LOG_PREFIX,
    `stage=${stage}`,
    coachMode ? `mode=${coachMode}` : null,
    coachPreferences ? `preferences=${JSON.stringify(coachPreferences)}` : null
  ]
    .filter(Boolean)
    .join(' | ');

  console.log(`\n${SEPARATOR}`);
  console.log(header);
  console.log(SEPARATOR);

  if (userText?.trim()) {
    console.log('[user]');
    console.log(userText.trim());
    console.log(SEPARATOR);
  }

  console.log('[prompt]');
  console.log(prompt.trim());
  console.log(`${SEPARATOR}\n`);
}
