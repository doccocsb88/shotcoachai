import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from './theme';

/** Top inset for app headers — use `useNavBarTopInset()` in components when possible. */
export function useNavBarTopInset(): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'ios') {
    return insets.top;
  }
  return (StatusBar.currentHeight ?? 0) + spacing.md;
}

/** @deprecated Prefer `useNavBarTopInset()` for correct safe area on all devices. */
export const navBarTopPadding = Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + spacing.md;

export const navBarBottomPadding = 24;
