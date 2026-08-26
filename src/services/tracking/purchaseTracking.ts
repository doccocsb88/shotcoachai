import { Platform } from 'react-native';

import {
  PurchaseProduct,
  PurchaseProductId,
  PurchaseResult,
  RestoreResult
} from '../purchase/PurchaseService';
import { purchaseCommerceParams } from './trackingCommerce';
import { TrackingManager } from './TrackingManager';

type PaywallSelectSource = 'plan_card' | 'primary_cta';

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'unknown_error';
  return message.slice(0, 180);
}

/** @deprecated Use TrackingManager.paywall instead. */
export const PurchaseTracking = {
  paywallImpression() {
    return TrackingManager.paywall.impression();
  },

  productsLoaded(products: PurchaseProduct[]) {
    return TrackingManager.paywall.productsLoaded(
      products.length,
      products.map(product => product.id).join(',')
    );
  },

  productsLoadFailed(error: unknown) {
    return TrackingManager.paywall.productsLoadFailed(errorMessage(error));
  },

  itemSelected(product: PurchaseProduct, source: PaywallSelectSource) {
    return TrackingManager.paywall.itemSelected(product, source);
  },

  purchaseStarted(product: PurchaseProduct, source: PaywallSelectSource) {
    return TrackingManager.paywall.purchaseStarted(product, source);
  },

  purchaseCompleted(product: PurchaseProduct, result: PurchaseResult) {
    const transaction = result.transaction;
    return TrackingManager.paywall.purchaseCompleted(product, {
      transaction_id: transaction?.id ?? 'unknown',
      product_id: product.id,
      original_transaction_id: transaction?.originalId ?? '',
      environment: transaction?.environment ?? '',
      ownership_type: transaction?.ownershipType ?? '',
      expiration_date: transaction?.expirationDate ?? '',
      platform: Platform.OS
    });
  },

  purchaseResolved(product: PurchaseProduct, result: PurchaseResult) {
    return TrackingManager.paywall.purchaseResolved(product.id, result.status);
  },

  purchaseFailed(productId: PurchaseProductId, error: unknown) {
    return TrackingManager.paywall.purchaseFailed(productId, errorMessage(error));
  },

  restoreStarted() {
    return TrackingManager.paywall.restoreStarted();
  },

  restoreCompleted(result: RestoreResult) {
    return TrackingManager.paywall.restoreCompleted(
      result.activeEntitlements.length,
      result.activeEntitlements.map(entitlement => entitlement.productId).join(',')
    );
  },

  restoreFailed(error: unknown) {
    return TrackingManager.paywall.restoreFailed(errorMessage(error));
  },

  dismissed(source?: string) {
    return TrackingManager.paywall.dismissed(source);
  }
};

export { purchaseCommerceParams };
