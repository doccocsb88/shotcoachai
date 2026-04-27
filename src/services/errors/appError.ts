export class AppError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function toUserMessage(error: unknown): string {
  const debugMessage = toDebugMessage(error);

  if (error instanceof AppError) {
    return appendDebug(error.message, debugMessage);
  }

  if (error instanceof SyntaxError) {
    return appendDebug('AI did not return a valid result.', debugMessage);
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return appendDebug('Analysis took longer than expected.', debugMessage);
    }

    if (error.message.includes('Network request failed')) {
      return appendDebug('Could not send the photo for analysis.', debugMessage);
    }

    if (error.message.includes('OpenAI request failed')) {
      return appendDebug('Could not send the photo for analysis.', debugMessage);
    }

    if (error.message.includes('timeout')) {
      return appendDebug('Analysis took longer than expected.', debugMessage);
    }

    return appendDebug(error.message, debugMessage);
  }

  return appendDebug('An unknown error occurred.', debugMessage);
}

export function toGuideImageMessage(error: unknown): string {
  const debugMessage = toDebugMessage(error);

  if (error instanceof AppError && error.code === 'TIMEOUT') {
    return appendDebug('AI image generation took longer than expected.', debugMessage);
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return appendDebug('AI image generation took longer than expected.', debugMessage);
    }

    if (error.message.includes('OpenAI image generation failed')) {
      return appendDebug('Could not generate the AI image from the suggestions.', debugMessage);
    }

    if (error.message.includes('No generated image returned')) {
      return appendDebug('AI did not return a valid generated image.', debugMessage);
    }
  }

  return appendDebug(toUserMessage(error), debugMessage);
}

function appendDebug(message: string, debugMessage: string): string {
  if (!shouldShowDebugErrors() || !debugMessage) {
    return message;
  }

  return `${message}\n\nDebug: ${debugMessage}`;
}

function shouldShowDebugErrors(): boolean {
  return process.env.EXPO_PUBLIC_DEBUG_ERRORS === '1' || (typeof __DEV__ !== 'undefined' && __DEV__);
}

function toDebugMessage(error: unknown): string {
  if (error instanceof Error) {
    return truncate(error.message, 1200);
  }

  if (typeof error === 'string') {
    return truncate(error, 1200);
  }

  try {
    return truncate(JSON.stringify(error), 1200);
  } catch {
    return '';
  }
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}
