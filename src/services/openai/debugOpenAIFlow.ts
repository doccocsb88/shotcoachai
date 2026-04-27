export function shouldDebugOpenAIFlow(): boolean {
  return process.env.EXPO_PUBLIC_DEBUG_OPENAI_FLOW === '1' || (typeof __DEV__ !== 'undefined' && __DEV__);
}

export function logOpenAIAnalysisRequest(input: {
  url: string;
  model: string;
  mimeType: string;
  imageBase64Length: number;
  body: unknown;
}) {
  if (!shouldDebugOpenAIFlow()) return;

  const body = redactAnalysisBody(input.body);

  console.log('[ShotCoach][OpenAI][analysis] request', {
    url: input.url,
    model: input.model,
    mimeType: input.mimeType,
    imageBase64Length: input.imageBase64Length,
    body
  });

  console.log(
    '[ShotCoach][OpenAI][analysis] curl\n' +
      [
        `curl -sS '${input.url}' \\`,
        `  -H 'Content-Type: application/json' \\`,
        `  -H 'Authorization: Bearer <REDACTED_OPENAI_API_KEY>' \\`,
        `  -d '${escapeSingleQuotedShellJson(JSON.stringify(body))}'`
      ].join('\n')
  );
}

export function logOpenAIAnalysisResponse(input: {
  status: number;
  ok: boolean;
  elapsedMs: number;
  outputText?: string;
}) {
  if (!shouldDebugOpenAIFlow()) return;

  console.log('[ShotCoach][OpenAI][analysis] response', input);
}

export function logOpenAIImageEditRequest(input: {
  url: string;
  model: string;
  size: string;
  quality?: string;
  outputFormat?: string;
  imageUri: string;
  mimeType: string;
  prompt: string;
}) {
  if (!shouldDebugOpenAIFlow()) return;

  const curlImagePath = toCurlFilePath(input.imageUri);

  console.log('[ShotCoach][OpenAI][image-edit] request', input);

  console.log(
    '[ShotCoach][OpenAI][image-edit] curl\n' +
      [
        `curl -sS '${input.url}' \\`,
        `  -H 'Authorization: Bearer <REDACTED_OPENAI_API_KEY>' \\`,
        `  -F 'model=${escapeSingleQuotedShell(input.model)}' \\`,
        `  -F 'image=@${escapeSingleQuotedShell(curlImagePath)};type=${escapeSingleQuotedShell(input.mimeType)}' \\`,
        `  -F 'prompt=${escapeSingleQuotedShell(input.prompt)}' \\`,
        `  -F 'size=${escapeSingleQuotedShell(input.size)}'` +
          (input.quality ? ` \\\n  -F 'quality=${escapeSingleQuotedShell(input.quality)}'` : '') +
          (input.outputFormat ? ` \\\n  -F 'output_format=${escapeSingleQuotedShell(input.outputFormat)}'` : '')
      ].join('\n')
  );
}

export function logOpenAIImageEditResponse(input: {
  status: number;
  ok: boolean;
  elapsedMs: number;
  generatedBase64Length?: number;
  revisedPrompt?: string;
}) {
  if (!shouldDebugOpenAIFlow()) return;

  console.log('[ShotCoach][OpenAI][image-edit] response', input);
}

function redactAnalysisBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;

  return JSON.parse(
    JSON.stringify(body, (_key, value) => {
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        const [prefix, base64 = ''] = value.split('base64,');
        return `${prefix}base64,<REDACTED_BASE64_IMAGE length=${base64.length}>`;
      }
      return value;
    })
  );
}

function escapeSingleQuotedShellJson(value: string): string {
  return value.replace(/'/g, "'\"'\"'");
}

function escapeSingleQuotedShell(value: string): string {
  return value.replace(/'/g, "'\"'\"'");
}

function toCurlFilePath(uri: string): string {
  return uri.startsWith('file://') ? decodeURIComponent(uri.slice('file://'.length)) : uri;
}
