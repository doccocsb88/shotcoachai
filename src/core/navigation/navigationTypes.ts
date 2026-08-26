import { NavigatorScreenParams } from '@react-navigation/native';

import { PhotoAiToolId } from '../../models/photoAiTool';
import { PaywallType } from '../../features/paywall/PaywallScreen';

export type ScreenName =
  | 'home'
  | 'camera'
  | 'poseAssist'
  | 'analyzing'
  | 'analysisResult'
  | 'generatedResult'
  | 'history'
  | 'recipeList'
  | 'recipeDetail'
  | 'poseCollection'
  | 'poseCollectionDetail'
  | 'poseCamera'
  | 'poseCapturePreview'
  | 'preview';

export type CameraIntent =
  | { type: 'coach' }
  | { type: 'tool'; toolId: PhotoAiToolId }
  | { type: 'recipe'; recipeId: string };

export type CameraSource = 'home' | 'recipeList';
export type PoseBrowseSource = 'home' | 'collection';

export type RootStackParamList = {
  Home: undefined;
  Camera: {
    intent: CameraIntent;
    source: CameraSource;
    referenceImageUri?: string | null;
  };
  History: undefined;
  PoseAssist: undefined;
  Preview: undefined;
  Analyzing: undefined;
  AnalysisResult: {
    openedFromHistory?: boolean;
  };
  GeneratedResult: {
    suggestionIndex?: number;
    openedFromHistory?: boolean;
    canReturnToAnalysis?: boolean;
  };
  RecipeList: {
    source?: 'home';
  };
  RecipeDetail: {
    recipeId: string;
    returnToGeneratedResult?: boolean;
  };
  PoseCollection: {
    source?: 'home' | 'collection';
  };
  PoseCollectionDetail: {
    collectionId: string;
    initialPoseId?: string;
    browseSource?: PoseBrowseSource;
  };
  PoseCamera: {
    browseSource?: PoseBrowseSource;
  };
  PoseCapturePreview: {
    photoUri: string;
  };
  Paywall: {
    paywallType: PaywallType;
    source?: string;
  };
  ImageViewer: undefined;
};

export type RootStackParams = NavigatorScreenParams<RootStackParamList>;

export function routeNameToTrackingScreen(routeName: keyof RootStackParamList): ScreenName {
  const mapping: Record<keyof RootStackParamList, ScreenName> = {
    Home: 'home',
    Camera: 'camera',
    History: 'history',
    PoseAssist: 'poseAssist',
    Preview: 'preview',
    Analyzing: 'analyzing',
    AnalysisResult: 'analysisResult',
    GeneratedResult: 'generatedResult',
    RecipeList: 'recipeList',
    RecipeDetail: 'recipeDetail',
    PoseCollection: 'poseCollection',
    PoseCollectionDetail: 'poseCollectionDetail',
    PoseCamera: 'poseCamera',
    PoseCapturePreview: 'poseCapturePreview',
    Paywall: 'home',
    ImageViewer: 'history'
  };
  return mapping[routeName];
}
