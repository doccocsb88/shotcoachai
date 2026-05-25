import {
  PurchaseProduct,
  PurchaseProductId,
  PurchaseResult,
  RestoreResult
} from '../purchase/PurchaseService';
import { trackEvent } from './firebaseTracking';

type PaywallSelectSource = 'plan_card' | 'primary_cta';

function productParams(product: PurchaseProduct) {
  return {
    item_id: product.id,
    item_name: product.displayName,
    item_category: product.type,
    price_label: product.displayPrice
  };
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'unknown_error';
  return message.slice(0, 180);
}

export const PurchaseTracking = {
  paywallImpression() {
    return trackEvent('paywall_impression');
  },

  productsLoaded(products: PurchaseProduct[]) {
    return trackEvent('paywall_products_loaded', {
      product_count: products.length,
      product_ids: products.map(product => product.id).join(',')
    });
  },

  productsLoadFailed(error: unknown) {
    return trackEvent('paywall_products_load_failed', {
      error_message: errorMessage(error)
    });
  },

  itemSelected(product: PurchaseProduct, source: PaywallSelectSource) {
    return trackEvent('select_item', {
      item_list_id: 'shotcoach_paywall',
      item_list_name: 'ShotCoach Paywall',
      source,
      ...productParams(product)
    });
  },

  purchaseStarted(product: PurchaseProduct, source: PaywallSelectSource) {
    return trackEvent('begin_checkout', {
      source,
      ...productParams(product)
    });
  },

  purchaseCompleted(product: PurchaseProduct, result: PurchaseResult) {
    const transaction = result.transaction;

    void trackEvent('purchase', {
      transaction_id: transaction?.id ?? 'unknown',
      affiliation: 'app_store',
      item_id: product.id,
      item_name: product.displayName,
      item_category: product.type,
      price_label: product.displayPrice
    });

    return trackEvent('paywall_purchase_completed', {
      product_id: product.id,
      transaction_id: transaction?.id ?? '',
      original_transaction_id: transaction?.originalId ?? '',
      environment: transaction?.environment ?? '',
      ownership_type: transaction?.ownershipType ?? '',
      expiration_date: transaction?.expirationDate ?? ''
    });
  },

  purchaseResolved(product: PurchaseProduct, result: PurchaseResult) {
    return trackEvent('paywall_purchase_result', {
      product_id: product.id,
      status: result.status
    });
  },

  purchaseFailed(productId: PurchaseProductId, error: unknown) {
    return trackEvent('paywall_purchase_failed', {
      product_id: productId,
      error_message: errorMessage(error)
    });
  },

  restoreStarted() {
    return trackEvent('paywall_restore_started');
  },

  restoreCompleted(result: RestoreResult) {
    return trackEvent('paywall_restore_completed', {
      entitlement_count: result.activeEntitlements.length,
      active_product_ids: result.activeEntitlements.map(entitlement => entitlement.productId).join(',')
    });
  },

  restoreFailed(error: unknown) {
    return trackEvent('paywall_restore_failed', {
      error_message: errorMessage(error)
    });
  },

  dismissed() {
    return trackEvent('paywall_dismissed');
  }
};
