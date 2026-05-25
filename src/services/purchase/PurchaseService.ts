import { NativeModules, Platform } from 'react-native';

export type PurchaseProductId =
  | 'co.q7labs.shotcoachai.weekly1'
  | 'co.q7labs.shotcoachai.monthlytrial1'
  | 'co.q7labs.shotcoachai.lifetime1';

export type PurchaseProduct = {
  id: PurchaseProductId;
  displayName: string;
  description: string;
  displayPrice: string;
  type: string;
};

export type PurchaseTransaction = {
  id: string;
  originalId: string;
  productId: PurchaseProductId;
  purchaseDate: string;
  expirationDate?: string;
  revocationDate?: string;
  environment: string;
  ownershipType: string;
};

export type PurchaseResult = {
  status: 'purchased' | 'cancelled' | 'pending' | 'unknown';
  transaction?: PurchaseTransaction;
  activeEntitlements?: PurchaseTransaction[];
};

export type RestoreResult = {
  status: 'restored';
  activeEntitlements: PurchaseTransaction[];
};

export type VerifyResult = {
  isPremium: boolean;
  activeEntitlements: PurchaseTransaction[];
};

type NativePurchaseModule = {
  getProducts: () => Promise<PurchaseProduct[]>;
  purchase: (productId: PurchaseProductId) => Promise<PurchaseResult>;
  restore: () => Promise<RestoreResult>;
  verify: () => Promise<VerifyResult>;
  manageSubscriptions: () => Promise<{ status: 'opened' }>;
};

const nativeModule = NativeModules.PurchaseModule as NativePurchaseModule | undefined;

function requireNativePurchaseModule(): NativePurchaseModule {
  if (Platform.OS !== 'ios' || !nativeModule) {
    throw new Error('PurchaseService is only implemented with StoreKit 2 on iOS.');
  }

  return nativeModule;
}

export const purchaseProductIds: PurchaseProductId[] = [
  'co.q7labs.shotcoachai.weekly1',
  'co.q7labs.shotcoachai.monthlytrial1',
  'co.q7labs.shotcoachai.lifetime1'
];

export const PurchaseService = {
  getProducts(): Promise<PurchaseProduct[]> {
    return requireNativePurchaseModule().getProducts();
  },

  purchase(productId: PurchaseProductId): Promise<PurchaseResult> {
    return requireNativePurchaseModule().purchase(productId);
  },

  restore(): Promise<RestoreResult> {
    return requireNativePurchaseModule().restore();
  },

  verify(): Promise<VerifyResult> {
    return requireNativePurchaseModule().verify();
  },

  manageSubscriptions(): Promise<{ status: 'opened' }> {
    return requireNativePurchaseModule().manageSubscriptions();
  }
};
