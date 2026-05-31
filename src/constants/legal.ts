import { Platform } from 'react-native';

export const LEGAL_URLS = {
  privacyPolicy: Platform.OS === 'android' ? 'https://doccocsb88.github.io/privacy-policy-android.html' : 'https://doccocsb88.github.io/privacy-policy.html',
  termsOfUse: 'https://doccocsb88.github.io/terms-of-use.html'
} as const;

export const SUPPORT_EMAIL = 'mrhaihcmus@gmail.com';
