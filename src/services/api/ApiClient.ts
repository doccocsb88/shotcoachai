import { CoachMode } from '../../core/store/analysisStore';
import { AnalysisResult, CoachDirectionV2, CoachPhotoAnalysisV2, ImageQualityEvaluation, Suggestion } from '../../models/analysis';
import { CoachPreferences } from '../../models/coachPreferences';
import { PhotoAiToolId } from '../../models/photoAiTool';
import { PhotoRecipe } from '../../models/photoRecipe';
import { FirebaseSession } from '../firebase/firebaseSession';

const DEFAULT_BASE_URL = 'https://shotcoachai-backend.vercel.app';
const DEFAULT_TIMEOUT_MS = 90_000;

export interface ShotCoachApiErrorPayload {
  error?: {
    message?: string;
    details?: Record<string, unknown>;
  };
}

export class ShotCoachApiError extends Error {
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ShotCoachApiError';
    this.status = status;
    this.details = details;
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
  authHeadersProvider?: (forceRefresh?: boolean) => Promise<Record<string, string>>;
}

export type FlowVersion = 'v1' | 'v2';

export interface AnalyzePhotoRequest {
  imageBase64: string;
  mimeType?: string;
  toolId?: PhotoAiToolId;
  coachMode?: CoachMode;
  coachPreferences?: CoachPreferences;
  flowVersion?: FlowVersion;
  originalImageUri?: string;
  originalImageMimeType?: string;
}

export interface CoachAnalyzeResponse
  extends Pick<AnalysisResult, 'analysisId' | 'flowType' | 'overallAssessment' | 'suggestions' | 'createdAt'> {
  coachAnalysisV2?: CoachPhotoAnalysisV2;
  coachDirectionsV2?: CoachDirectionV2[];
  originalImageUri?: string;
  originalImageMimeType?: string;
}

export interface DirectEditRequest {
  imageBase64: string;
  mimeType?: string;
  coachMode?: CoachMode;
  coachPreferences?: CoachPreferences;
}

export interface SelectedDirectionInput {
  title: string;
}

export interface PromptImageEditRequest {
  imageBase64: string;
  mimeType?: string;
  prompt: string;
  toolId?: PhotoAiToolId;
  evaluateQuality?: boolean;
  selectedDirection?: SelectedDirectionInput;
  originalImageBase64?: string;
}

export interface GeneratedImageResponse {
  generatedImageBase64: string;
  promptUsed?: string;
  model?: string;
  size?: string;
}

export interface PromptImageEditResponse extends GeneratedImageResponse {
  toolId?: PhotoAiToolId;
  qualityEvaluation?: ImageQualityEvaluation;
}

export interface SuggestionListItem extends Suggestion {}

export interface ToolEditRequest {
  imageBase64: string;
  mimeType?: string;
  toolId: Exclude<PhotoAiToolId, 'ai_coach' | 'photo_recipe'>;
  instruction?: string;
  evaluateQuality?: boolean;
  selectedDirection?: SelectedDirectionInput;
  originalImageBase64?: string;
}

export interface RecipeApplyRequest {
  imageBase64: string;
  mimeType?: string;
  recipe: PhotoRecipe;
  evaluateQuality?: boolean;
  selectedDirection?: SelectedDirectionInput;
  originalImageBase64?: string;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;
  private readonly authHeadersProvider?: (forceRefresh?: boolean) => Promise<Record<string, string>>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.EXPO_PUBLIC_SHOTCOACH_API_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders
    };
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.authHeadersProvider = options.authHeadersProvider;
  }

  analyzePhoto(request: AnalyzePhotoRequest, signal?: AbortSignal): Promise<CoachAnalyzeResponse> {
    return this.post('/api/v1/coach/analyze', {
      imageBase64: request.imageBase64,
      mimeType: request.mimeType ?? 'image/jpeg',
      toolId: request.toolId ?? 'ai_coach',
      coachMode: request.coachMode ?? 'comprehensive',
      coachPreferences: request.coachPreferences,
      flowVersion: request.flowVersion ?? 'v2',
      originalImageUri: request.originalImageUri ?? 'source_photo',
      originalImageMimeType: request.originalImageMimeType
    }, signal);
  }

  directEdit(request: DirectEditRequest, signal?: AbortSignal): Promise<GeneratedImageResponse> {
    return this.post('/api/v1/coach/direct-edit', {
      imageBase64: request.imageBase64,
      mimeType: request.mimeType ?? 'image/jpeg',
      coachMode: request.coachMode ?? 'comprehensive',
      coachPreferences: request.coachPreferences
    }, signal);
  }

  editImage(request: PromptImageEditRequest, signal?: AbortSignal): Promise<PromptImageEditResponse> {
    return this.post('/api/v1/images/edit', {
      imageBase64: request.imageBase64,
      mimeType: request.mimeType ?? 'image/jpeg',
      prompt: request.prompt,
      toolId: request.toolId ?? 'ai_coach',
      evaluateQuality: request.evaluateQuality,
      selectedDirection: request.selectedDirection,
      originalImageBase64: request.originalImageBase64
    }, signal);
  }

  toolEdit(request: ToolEditRequest, signal?: AbortSignal): Promise<PromptImageEditResponse> {
    return this.post('/api/v1/tools/edit', {
      imageBase64: request.imageBase64,
      mimeType: request.mimeType ?? 'image/jpeg',
      toolId: request.toolId,
      instruction: request.instruction,
      evaluateQuality: request.evaluateQuality,
      selectedDirection: request.selectedDirection,
      originalImageBase64: request.originalImageBase64
    }, signal);
  }

  recipeApply(request: RecipeApplyRequest, signal?: AbortSignal): Promise<PromptImageEditResponse> {
    return this.post('/api/v1/recipes/apply', {
      imageBase64: request.imageBase64,
      mimeType: request.mimeType ?? 'image/jpeg',
      recipe: request.recipe,
      evaluateQuality: request.evaluateQuality,
      selectedDirection: request.selectedDirection,
      originalImageBase64: request.originalImageBase64
    }, signal);
  }

  private async post<TResponse>(
    path: string,
    body: Record<string, unknown>,
    externalSignal?: AbortSignal,
    didRetry = false
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    const signal = this.mergeSignals(controller.signal, externalSignal);

    try {
      const authHeaders = this.authHeadersProvider ? await this.authHeadersProvider(false) : undefined;
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...authHeaders
        },
        body: JSON.stringify(this.removeUndefined(body)),
        signal
      });

      if ((response.status === 401 || response.status === 403) && this.authHeadersProvider && !didRetry) {
        await this.authHeadersProvider(true);
        return this.post(path, body, externalSignal, true);
      }

      const rawText = await response.text();
      const parsed = this.parseJson(rawText);

      if (!response.ok) {
        const payload = parsed as ShotCoachApiErrorPayload | undefined;
        throw new ShotCoachApiError(
          payload?.error?.message ?? `Request failed with status ${response.status}`,
          response.status,
          payload?.error?.details
        );
      }

      return parsed as TResponse;
    } catch (error) {
      if (this.isAbortError(error)) {
        throw new ShotCoachApiError(`Request timed out after ${this.timeoutMs}ms`, 0);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseJson(rawText: string): unknown {
    if (!rawText.trim()) {
      return {};
    }

    try {
      return JSON.parse(rawText);
    } catch {
      return {};
    }
  }

  private removeUndefined<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
  }

  private mergeSignals(internalSignal: AbortSignal, externalSignal?: AbortSignal): AbortSignal {
    if (!externalSignal) {
      return internalSignal;
    }

    if (externalSignal.aborted) {
      return externalSignal;
    }

    const controller = new AbortController();
    const abort = () => controller.abort();

    internalSignal.addEventListener('abort', abort, { once: true });
    externalSignal.addEventListener('abort', abort, { once: true });

    return controller.signal;
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }
}

export const shotCoachApiClient = new ApiClient({
  authHeadersProvider: (forceRefresh?: boolean) => FirebaseSession.getRequestHeaders(forceRefresh)
});
