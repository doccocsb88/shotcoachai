import { NativeModules } from 'react-native';

export type PurchaseProductId =
  | 'co.q7labs.shotcoachai.weekly1'
  | 'co.q7labs.shotcoachai.monthlytrial1'
  | 'co.q7labs.shotcoachai.lifetime1';

export type PurchaseProduct = {
  id: PurchaseProductId;
  displayName: string;
  description: string;
  displayPrice: string;
  priceAmount?: number;
  currencyCode?: string;
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

const isAvailable = !!nativeModule;

function requireNativePurchaseModule(): NativePurchaseModule {
  if (!isAvailable) {
    throw new Error('PurchaseService is not available on this platform.');
  }

  return nativeModule!;
}

export const purchaseProductIds: PurchaseProductId[] = [
  'co.q7labs.shotcoachai.weekly1',
  'co.q7labs.shotcoachai.monthlytrial1',
  'co.q7labs.shotcoachai.lifetime1'
];

export const PurchaseService = {
  /** Whether in-app purchases are available on the current platform. */
  isAvailable,

  getProducts(): Promise<PurchaseProduct[]> {
    if (!isAvailable) return Promise.resolve([]);
    return requireNativePurchaseModule().getProducts();
  },

  purchase(productId: PurchaseProductId): Promise<PurchaseResult> {
    return requireNativePurchaseModule().purchase(productId);
  },

  restore(): Promise<RestoreResult> {
    if (!isAvailable) return Promise.resolve({ status: 'restored' as const, activeEntitlements: [] });
    return requireNativePurchaseModule().restore();
  },

  verify(): Promise<VerifyResult> {
    if (!isAvailable) return Promise.resolve({ isPremium: false, activeEntitlements: [] });
    return requireNativePurchaseModule().verify();
  },

  manageSubscriptions(): Promise<{ status: 'opened' }> {
    return requireNativePurchaseModule().manageSubscriptions();
  }
};
