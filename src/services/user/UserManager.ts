import AsyncStorage from '@react-native-async-storage/async-storage';

import { PurchaseService } from '../purchase/PurchaseService';

const FREE_CAPTURE_LIMIT = 3;
const FREE_SUGGESTION_INDEX = 0;
const CAPTURE_COUNT_KEY = '@shotcoach/free_capture_count';
const USED_AI_TOOLS_KEY = '@shotcoach/used_ai_tools';
const USED_RECIPES_KEY = '@shotcoach/used_recipes';

export type UserAccessState = {
  isPremium: boolean;
  freeCaptureCount: number;
  freeCaptureLimit: number;
  usedAiTools: string[];
  usedRecipes: string[];
};

type Listener = (state: UserAccessState) => void;

class ShotCoachUserManager {
  private state: UserAccessState = {
    isPremium: false,
    freeCaptureCount: 0,
    freeCaptureLimit: FREE_CAPTURE_LIMIT,
    usedAiTools: [],
    usedRecipes: []
  };

  private hydrated = false;
  private refreshPromise: Promise<UserAccessState> | null = null;
  private listeners = new Set<Listener>();

  getState(): UserAccessState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async refresh(): Promise<UserAccessState> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.loadState();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async ensureReady(): Promise<UserAccessState> {
    if (this.hydrated) {
      return this.state;
    }
    return this.refresh();
  }

  private async loadState(): Promise<UserAccessState> {
    const [freeCaptureCount, isPremium, usedAiTools, usedRecipes] = await Promise.all([
      this.loadFreeCaptureCount(),
      this.verifyPremium(),
      this.loadUsedItems(USED_AI_TOOLS_KEY),
      this.loadUsedItems(USED_RECIPES_KEY)
    ]);
    this.setState({ freeCaptureCount, isPremium, usedAiTools, usedRecipes });
    this.hydrated = true;
    return this.state;
  }

  canStartCapture(): boolean {
    return this.state.isPremium || this.state.freeCaptureCount < FREE_CAPTURE_LIMIT;
  }

  async trackCaptureStarted(): Promise<UserAccessState> {
    if (this.state.isPremium) {
      return this.state;
    }

    const nextCount = Math.min(this.state.freeCaptureCount + 1, FREE_CAPTURE_LIMIT);
    await AsyncStorage.setItem(CAPTURE_COUNT_KEY, String(nextCount));
    this.setState({ freeCaptureCount: nextCount });
    return this.state;
  }

  canUseSuggestion(suggestionIndex: number): boolean {
    return this.state.isPremium || suggestionIndex === FREE_SUGGESTION_INDEX;
  }

  remainingFreeCaptures(): number {
    if (this.state.isPremium) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.max(0, FREE_CAPTURE_LIMIT - this.state.freeCaptureCount);
  }

  async markPremiumActive(): Promise<UserAccessState> {
    this.setState({ isPremium: true });
    return this.state;
  }

  canUseAiTool(toolId: string): boolean {
    return this.state.isPremium || !this.state.usedAiTools.includes(toolId);
  }

  async trackAiToolUsed(toolId: string): Promise<UserAccessState> {
    if (this.state.isPremium || this.state.usedAiTools.includes(toolId)) return this.state;
    const nextTools = [...this.state.usedAiTools, toolId];
    await AsyncStorage.setItem(USED_AI_TOOLS_KEY, JSON.stringify(nextTools));
    this.setState({ usedAiTools: nextTools });
    return this.state;
  }

  canUseRecipe(recipeId: string): boolean {
    return this.state.isPremium || !this.state.usedRecipes.includes(recipeId);
  }

  async trackRecipeUsed(recipeId: string): Promise<UserAccessState> {
    if (this.state.isPremium || this.state.usedRecipes.includes(recipeId)) return this.state;
    const nextRecipes = [...this.state.usedRecipes, recipeId];
    await AsyncStorage.setItem(USED_RECIPES_KEY, JSON.stringify(nextRecipes));
    this.setState({ usedRecipes: nextRecipes });
    return this.state;
  }

  private async loadFreeCaptureCount(): Promise<number> {
    const raw = await AsyncStorage.getItem(CAPTURE_COUNT_KEY);
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0, Math.min(value, FREE_CAPTURE_LIMIT)) : 0;
  }

  private async verifyPremium(): Promise<boolean> {
    try {
      return (await PurchaseService.verify()).isPremium;
    } catch {
      return false;
    }
  }

  private async loadUsedItems(key: string): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setState(next: Partial<UserAccessState>): void {
    this.state = { ...this.state, ...next };
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const UserManager = new ShotCoachUserManager();
