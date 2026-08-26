import { createNavigationContainerRef, StackActions } from '@react-navigation/native';

import { RootStackParamList } from './navigationTypes';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function getCurrentRouteName(): keyof RootStackParamList {
  if (!navigationRef.isReady()) {
    return 'Home';
  }
  return (navigationRef.getCurrentRoute()?.name as keyof RootStackParamList) ?? 'Home';
}

export function resetToHome() {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.reset({
    index: 0,
    routes: [{ name: 'Home' }]
  });
}

export function navigate<RouteName extends keyof RootStackParamList>(
  ...args: undefined extends RootStackParamList[RouteName]
    ? [screen: RouteName] | [screen: RouteName, params: RootStackParamList[RouteName]]
    : [screen: RouteName, params: RootStackParamList[RouteName]]
) {
  if (!navigationRef.isReady()) {
    return;
  }
  // @ts-expect-error React Navigation overload typing
  navigationRef.navigate(...args);
}

export function push<RouteName extends keyof RootStackParamList>(
  ...args: undefined extends RootStackParamList[RouteName]
    ? [screen: RouteName] | [screen: RouteName, params: RootStackParamList[RouteName]]
    : [screen: RouteName, params: RootStackParamList[RouteName]]
) {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(StackActions.push(args[0], args[1]));
}

export function popToTop() {
  if (!navigationRef.isReady()) {
    return;
  }
  if (navigationRef.canGoBack()) {
    navigationRef.dispatch(StackActions.popToTop());
  }
}

export function hasScreenInStack(screen: keyof RootStackParamList): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }
  return navigationRef.getState().routes.some(route => route.name === screen);
}

export function popToScreen<RouteName extends keyof RootStackParamList>(
  screen: RouteName,
  params?: RootStackParamList[RouteName],
  options?: { merge?: boolean }
): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }
  if (!hasScreenInStack(screen)) {
    return false;
  }
  navigationRef.dispatch(StackActions.popTo(screen, params, options));
  return true;
}

export function goBack() {
  if (!navigationRef.isReady() || !navigationRef.canGoBack()) {
    return;
  }
  navigationRef.goBack();
}
