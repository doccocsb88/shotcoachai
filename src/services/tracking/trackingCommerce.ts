import { Platform } from 'react-native';

import { PurchaseProduct, PurchaseProductId } from '../purchase/PurchaseService';

export type TrackingCommerceItem = {
  item_id: string;
  item_name: string;
  item_category: string;
  item_variant: string;
  price: number;
  quantity: number;
};

export function storeAffiliation(): string {
  return Platform.OS === 'ios' ? 'app_store' : 'google_play';
}

export function productPlanVariant(productId: PurchaseProductId): string {
  if (productId.includes('weekly')) return 'weekly';
  if (productId.includes('monthly')) return 'monthly';
  if (productId.includes('lifetime')) return 'lifetime';
  return 'unknown';
}

export function purchaseItemFromProduct(product: PurchaseProduct): TrackingCommerceItem {
  return {
    item_id: product.id,
    item_name: product.displayName,
    item_category: 'subscription',
    item_variant: productPlanVariant(product.id),
    price: product.priceAmount ?? 0,
    quantity: 1
  };
}

export function purchaseCommerceParams(
  product: PurchaseProduct,
  extras?: Record<string, string | number>
): Record<string, string | number | TrackingCommerceItem[]> {
  const item = purchaseItemFromProduct(product);

  return {
    affiliation: storeAffiliation(),
    currency: product.currencyCode ?? 'USD',
    value: product.priceAmount ?? 0,
    item_id: product.id,
    item_name: product.displayName,
    item_category: item.item_category,
    item_variant: item.item_variant,
    price_label: product.displayPrice,
    items: [item],
    ...extras
  };
}

export function checkoutCommerceParams(
  product: PurchaseProduct,
  source: string
): Record<string, string | number | TrackingCommerceItem[]> {
  return purchaseCommerceParams(product, { source });
}

export function selectItemCommerceParams(
  product: PurchaseProduct,
  source: string
): Record<string, string | number | TrackingCommerceItem[]> {
  return {
    item_list_id: 'shotcoach_paywall',
    item_list_name: 'ShotCoach Paywall',
    ...checkoutCommerceParams(product, source)
  };
}
