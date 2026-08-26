import { Platform } from 'react-native';

export type LegalDocumentKey = 'privacyPolicy' | 'termsOfUse';

/** Bundled legal HTML — avoids broken remote markdown pages and works offline. */
export const LEGAL_DOCUMENT_MODULES: Record<LegalDocumentKey, number> = {
  privacyPolicy:
    Platform.OS === 'android'
      ? require('../../assets/legal/privacy-policy-android.html')
      : require('../../assets/legal/privacy-policy.html'),
  termsOfUse: require('../../assets/legal/terms-of-use.html')
};

/** Remote fallbacks (e.g. store listings); in-app WebView uses bundled modules. */
export const LEGAL_URLS = {
  privacyPolicy:
    Platform.OS === 'android'
      ? 'https://doccocsb88.github.io/privacy-policy-android.html'
      : 'https://doccocsb88.github.io/privacy-policy.html',
  termsOfUse: 'https://doccocsb88.github.io/terms-of-use.html'
} as const;

export const SUPPORT_EMAIL = 'mrhaihcmus@gmail.com';
