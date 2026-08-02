import { Platform, StatusBar } from 'react-native';

import { spacing } from './theme';

/** Top inset for app headers (Home, Settings, etc.) — matches status bar + breathing room on Android. */
export const navBarTopPadding = Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + spacing.md;

export const navBarBottomPadding = 24;
