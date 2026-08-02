import {
  setTrackingUserId as firebaseSetUserId,
  trackEvent as firebaseTrackEvent,
  trackScreenView as firebaseTrackScreenView
} from './firebaseTracking';

export type TrackingFlowType = 'ai_coach' | 'editing_tool' | 'photo_recipe' | 'pose';

type TrackingParams = Record<string, unknown>;

let activeFlowId: string | null = null;
let activeFlowType: TrackingFlowType | null = null;

function createFlowId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeValue(value: unknown): string | number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return String(value).slice(0, 100);
}

function sanitizeParams(params?: TrackingParams): Record<string, string | number> | undefined {
  if (!params) return undefined;

  const sanitized: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    const nextValue = sanitizeValue(value);
    if (nextValue !== undefined) {
      sanitized[key.slice(0, 40)] = nextValue;
    }
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function withActiveFlow(params?: TrackingParams): TrackingParams {
  if (!activeFlowId) return params ?? {};
  return {
    flow_id: activeFlowId,
    ...(activeFlowType ? { flow_type: activeFlowType } : {}),
    ...params
  };
}

function track(eventName: string, params?: TrackingParams) {
  return firebaseTrackEvent(eventName, sanitizeParams(withActiveFlow(params)));
}

function startFlow(flowType: TrackingFlowType, params?: TrackingParams) {
  activeFlowId = createFlowId();
  activeFlowType = flowType;
  return track('flow_start', { flow_type: flowType, ...params });
}

function endFlow(reason: 'completed' | 'abandoned' | 'failed', params?: TrackingParams) {
  const payload = withActiveFlow({ end_reason: reason, ...params });
  void firebaseTrackEvent('flow_end', sanitizeParams(payload));
  activeFlowId = null;
  activeFlowType = null;
}

export const TrackingManager = {
  setUserId(userId: string | null) {
    return firebaseSetUserId(userId);
  },

  app: {
    open() {
      return track('app_open');
    }
  },

  screen: {
    view(screenName: string) {
      return firebaseTrackScreenView(screenName);
    }
  },

  onboarding: {
    started() {
      return track('onboarding_started');
    },
    pageViewed(pageIndex: number, pageCount: number) {
      return track('onboarding_page_view', { page_index: pageIndex, page_count: pageCount });
    },
    completed() {
      return track('onboarding_completed');
    }
  },

  home: {
    action(action: 'coach_hero' | 'quick_edit' | 'recipe_card' | 'recipe_see_all' | 'menu' | 'history', params?: TrackingParams) {
      return track('home_action', { action, ...params });
    }
  },

  settings: {
    opened() {
      return track('settings_opened');
    },
    action(action: 'store' | 'manage_subscription' | 'review' | 'contact' | 'share' | 'privacy_policy' | 'terms_of_use') {
      return track('settings_action', { action });
    }
  },

  history: {
    opened() {
      return track('history_opened');
    },
    itemOpened(flowType: TrackingFlowType) {
      return track('history_item_opened', { item_flow_type: flowType });
    }
  },

  paywall: {
    opened(source: string, paywallType: string) {
      return track('paywall_opened', { source, paywall_type: paywallType });
    },
    impression() {
      return track('paywall_impression');
    },
    productsLoaded(productCount: number, productIds: string) {
      return track('paywall_products_loaded', { product_count: productCount, product_ids: productIds });
    },
    productsLoadFailed(errorMessage: string) {
      return track('paywall_products_load_failed', { error_message: errorMessage });
    },
    itemSelected(itemId: string, itemName: string, itemCategory: string, priceLabel: string, source: string) {
      return track('select_item', {
        item_list_id: 'shotcoach_paywall',
        item_list_name: 'ShotCoach Paywall',
        item_id: itemId,
        item_name: itemName,
        item_category: itemCategory,
        price_label: priceLabel,
        source
      });
    },
    purchaseStarted(itemId: string, itemName: string, itemCategory: string, priceLabel: string, source: string) {
      return track('begin_checkout', {
        item_id: itemId,
        item_name: itemName,
        item_category: itemCategory,
        price_label: priceLabel,
        source
      });
    },
    purchaseCompleted(params: TrackingParams) {
      void track('purchase', params);
      return track('paywall_purchase_completed', params);
    },
    purchaseResolved(productId: string, status: string) {
      return track('paywall_purchase_result', { product_id: productId, status });
    },
    purchaseFailed(productId: string, errorMessage: string) {
      return track('paywall_purchase_failed', { product_id: productId, error_message: errorMessage });
    },
    restoreStarted() {
      return track('paywall_restore_started');
    },
    restoreCompleted(entitlementCount: number, activeProductIds: string) {
      return track('paywall_restore_completed', {
        entitlement_count: entitlementCount,
        active_product_ids: activeProductIds
      });
    },
    restoreFailed(errorMessage: string) {
      return track('paywall_restore_failed', { error_message: errorMessage });
    },
    dismissed() {
      return track('paywall_dismissed');
    }
  },

  ads: {
    idfaStatus(status: string) {
      return track('idfa_permission_status', { status });
    },
    idfaRequested(status: string) {
      return track('idfa_permission_requested', { status });
    }
  },

  consent: {
    aiProcessingShown(flowType: TrackingFlowType) {
      return track('ai_consent_shown', { flow_type: flowType });
    },
    aiProcessingAccepted(flowType: TrackingFlowType) {
      return track('ai_consent_accepted', { flow_type: flowType });
    },
    aiProcessingDeclined(flowType: TrackingFlowType) {
      return track('ai_consent_declined', { flow_type: flowType });
    }
  },

  flow: {
    start: startFlow,
    end: endFlow,
    cameraOpened(params: TrackingParams) {
      return track('camera_opened', params);
    },
    photoSelected(source: 'camera' | 'gallery', params?: TrackingParams) {
      return track('photo_selected', { photo_source: source, ...params });
    },
    photoRejected(reason: 'too_small' | 'permission_denied' | 'capture_failed') {
      return track('photo_rejected', { reason });
    },
    previewOpened(toolId: string) {
      return track('preview_opened', { tool_id: toolId });
    },
    recipeListOpened(source: string) {
      return track('recipe_list_opened', { source });
    },
    recipeSelected(recipeId: string, source: string) {
      return track('recipe_selected', { recipe_id: recipeId, source });
    },
    analysisStarted(params?: TrackingParams) {
      return track('analysis_started', params);
    },
    analysisCompleted(suggestionCount: number) {
      return track('analysis_completed', { suggestion_count: suggestionCount });
    },
    analysisFailed(errorMessage: string) {
      return track('analysis_failed', { error_message: errorMessage });
    },
    analysisResultViewed(suggestionCount: number) {
      return track('analysis_result_viewed', { suggestion_count: suggestionCount });
    },
    suggestionSelected(index: number, total: number) {
      return track('suggestion_selected', { suggestion_index: index, suggestion_total: total });
    },
    generationStarted(params?: TrackingParams) {
      return track('generation_started', params);
    },
    generationCompleted(params?: TrackingParams) {
      void track('generation_completed', params);
      endFlow('completed', { step: 'generation', ...params });
    },
    generationFailed(errorMessage: string, params?: TrackingParams) {
      return track('generation_failed', { error_message: errorMessage, ...params });
    },
    resultSaved(flowType: TrackingFlowType) {
      return track('result_saved', { result_flow_type: flowType });
    },
    resultShared(flowType: TrackingFlowType) {
      return track('result_shared', { result_flow_type: flowType });
    },
    resultRetake(flowType: TrackingFlowType) {
      return track('result_retake', { result_flow_type: flowType });
    }
  }
};
