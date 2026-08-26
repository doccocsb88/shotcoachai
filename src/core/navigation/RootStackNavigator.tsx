import { RouteProp, useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../../features/home/HomeScreen';
import { CameraScreen } from '../../features/camera/CameraScreen';
import { PoseAssistScreen } from '../../features/pose-assist/PoseAssistScreen';
import { AnalyzingScreen } from '../../features/analysis/AnalyzingScreen';
import { AnalysisResultScreen } from '../../features/result/AnalysisResultScreen';
import { GeneratedResultScreen } from '../../features/result/GeneratedResultScreen';
import { ImageResultView } from '../../features/result/ImageResultView';
import { HistoryScreen } from '../../features/history/HistoryScreen';
import { RecipeDetailScreen } from '../../features/photo-recipes/RecipeDetailScreen';
import { RecipeListScreen } from '../../features/photo-recipes/RecipeListScreen';
import { PoseCollectionScreen } from '../../features/pose-collection/PoseCollectionScreen';
import { PoseCollectionDetailScreen } from '../../features/pose-collection/PoseCollectionDetailScreen';
import { PoseCameraScreen } from '../../features/pose-collection/PoseCameraScreen';
import { PoseCapturePreviewScreen } from '../../features/pose-collection/PoseCapturePreviewScreen';
import { PhotoPreviewScreen } from '../../features/photo-preview/PhotoPreviewScreen';
import { getPhotoRecipe } from '../../services/photo-recipes/photoRecipeLibrary';
import { TrackingManager } from '../../services/tracking/TrackingManager';
import { getRecipeFromResult } from './createFlowResult';
import { useAppNavigation } from './AppNavigationProvider';
import { colors } from '../../constants/theme';
import { RootStackParamList } from './navigationTypes';
import { goBack, navigate } from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** iOS default for slide_from_bottom is 500ms — shorter for camera open/close. */
const cameraScreenStackOptions = {
  gestureEnabled: false,
  animation: 'slide_from_bottom' as const,
  animationDuration: 300
};

function HomeRouteScreen() {
  const navigation = useAppNavigation();
  return (
    <HomeScreen
      onOpenCamera={navigation.openCamera}
      onOpenMenu={() => {
        void TrackingManager.settings.opened();
        navigation.openMenu();
      }}
      onOpenHistory={navigation.openHistory}
      onOpenPaywall={navigation.openPaywall}
      onOpenRecipeList={() => navigation.openRecipeList('home')}
      onOpenPoseCollection={() => navigation.openPoseCollection('home')}
      onOpenPose={navigation.openFeaturedPose}
    />
  );
}

function CameraRouteScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Camera'>>();

  return (
    <CameraScreen
      onBack={() => {
        void TrackingManager.flow.abandon();
        goBack();
      }}
      onPhotoSelected={navigation.handlePhotoSelected}
      onCoachReferenceCreated={navigation.handleCoachReferenceCreated}
      onOpenPaywall={navigation.openPaywall}
      referenceImageUri={
        route.params.intent?.type === 'coach'
          ? navigation.coachReferenceUri
          : route.params.referenceImageUri
      }
      intent={route.params.intent}
    />
  );
}

function HistoryRouteScreen() {
  const navigation = useAppNavigation();
  return <HistoryScreen onBack={goBack} onOpenResult={navigation.openResultFromHistory} />;
}

function PoseAssistRouteScreen() {
  const navigation = useAppNavigation();
  return <PoseAssistScreen onBack={goBack} onContinue={navigation.openSelectedPreviewFlow} />;
}

function PreviewRouteScreen() {
  const navigation = useAppNavigation();
  return (
    <PhotoPreviewScreen
      onBack={goBack}
      onAnalyze={navigation.openSelectedPreviewFlow}
      onOpenRecipes={() => navigation.openRecipeList('home')}
      onOpenPaywall={() => navigation.openPaywall('Store')}
      initialStep="instructions"
    />
  );
}

function AnalyzingRouteScreen() {
  const navigation = useAppNavigation();
  return (
    <AnalyzingScreen
      onComplete={navigation.openAnalysisResult}
      onBack={goBack}
      onCancel={navigation.goHome}
    />
  );
}

function AnalysisResultRouteScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AnalysisResult'>>();
  const openedFromHistory = route.params?.openedFromHistory ?? false;
  const result = navigation.currentResult;

  if (!result) {
    return null;
  }

  return (
    <AnalysisResultScreen
      result={result}
      onOpenPaywall={navigation.openPaywall}
      onBack={openedFromHistory ? goBack : navigation.goHome}
      onSelectSuggestion={index => navigation.openGeneratedResult(index, undefined, openedFromHistory)}
    />
  );
}

function GeneratedResultRouteScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'GeneratedResult'>>();
  const result = navigation.currentResult;

  if (!result) {
    return null;
  }

  const suggestionIndex = route.params?.suggestionIndex ?? 0;
  const openedFromHistory = route.params?.openedFromHistory ?? false;
  const canReturnToAnalysis = route.params?.canReturnToAnalysis ?? !openedFromHistory;

  return (
    <GeneratedResultScreen
      result={result}
      suggestionIndex={suggestionIndex}
      onBack={navigation.handleGeneratedResultBack}
      onBackToAnalysis={() => navigate('AnalysisResult', { openedFromHistory })}
      onRetake={navigation.openRetakeCapture}
      onOpenRecipeDetail={getRecipeFromResult(result) ? navigation.openCurrentRecipeDetail : undefined}
      openedFromHistory={openedFromHistory}
      canReturnToAnalysis={canReturnToAnalysis}
    />
  );
}

function RecipeListRouteScreen() {
  const navigation = useAppNavigation();
  return (
    <RecipeListScreen
      onBack={goBack}
      onSelectRecipe={navigation.handleSelectRecipeFromList}
      onOpenPaywall={() => navigation.openPaywall('Store')}
    />
  );
}

function RecipeDetailRouteScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'RecipeDetail'>>();
  const recipe = navigation.selectedRecipe ?? getPhotoRecipe(route.params.recipeId);

  if (!recipe) {
    return null;
  }

  return (
    <RecipeDetailScreen
      recipe={recipe}
      onBack={() => {
        if (route.params.returnToGeneratedResult) {
          goBack();
          return;
        }
        if (navigation.currentResult && getRecipeFromResult(navigation.currentResult)) {
          navigate('GeneratedResult', {
            suggestionIndex: 0,
            openedFromHistory: false,
            canReturnToAnalysis: false
          });
          return;
        }
        goBack();
      }}
      onGenerate={navigation.generateRecipe}
      showGenerateAction={false}
    />
  );
}

function PoseCollectionRouteScreen() {
  const navigation = useAppNavigation();
  return (
    <PoseCollectionScreen
      onBack={goBack}
      onOpenCollection={navigation.openPoseCollectionDetail}
      onOpenPose={pose => navigation.openPoseFromBrowse(pose, 'collection')}
    />
  );
}

function PoseCollectionDetailRouteScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'PoseCollectionDetail'>>();

  return (
    <PoseCollectionDetailScreen
      collectionId={route.params.collectionId}
      initialPoseId={route.params.initialPoseId ?? navigation.initialCollectionPoseId}
      onInitialPoseHandled={() => navigation.setInitialCollectionPoseId(null)}
      onBack={goBack}
      onOpenPose={pose => navigation.openPoseFromBrowse(pose, 'collection')}
    />
  );
}

function PoseCameraRouteScreen() {
  const navigation = useAppNavigation();
  const pose = navigation.selectedPose;

  if (!pose) {
    return null;
  }

  return (
    <PoseCameraScreen
      pose={pose}
      onPoseChange={navigation.setSelectedPose}
      onBack={() => {
        void TrackingManager.flow.abandon();
        goBack();
      }}
      onCaptured={navigation.openPoseCapturePreview}
    />
  );
}

function PoseCapturePreviewRouteScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'PoseCapturePreview'>>();
  const pose = navigation.selectedPose;

  if (!pose) {
    return null;
  }

  return (
    <PoseCapturePreviewScreen
      pose={pose}
      photoUri={route.params.photoUri}
      onBack={goBack}
      onRetake={goBack}
    />
  );
}

function ImageViewerRouteScreen() {
  const navigation = useAppNavigation();
  const result = navigation.imageViewerResult;

  if (!result) {
    return null;
  }

  return <ImageResultView result={result} onBack={navigation.closeImageViewer} />;
}

export function RootStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: {
          backgroundColor: colors.background,
          flex: 1
        }
      }}
    >
      <Stack.Screen name="Home" component={HomeRouteScreen} />
      <Stack.Screen name="Camera" component={CameraRouteScreen} options={cameraScreenStackOptions} />
      <Stack.Screen name="History" component={HistoryRouteScreen} />
      <Stack.Screen name="PoseAssist" component={PoseAssistRouteScreen} />
      <Stack.Screen name="Preview" component={PreviewRouteScreen} />
      <Stack.Screen
        name="Analyzing"
        component={AnalyzingRouteScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="AnalysisResult" component={AnalysisResultRouteScreen} />
      <Stack.Screen
        name="GeneratedResult"
        component={GeneratedResultRouteScreen}
        options={{
          animation: 'slide_from_bottom',
          gestureEnabled: false,
          fullScreenGestureEnabled: false
        }}
      />
      <Stack.Screen name="RecipeList" component={RecipeListRouteScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailRouteScreen} />
      <Stack.Screen name="PoseCollection" component={PoseCollectionRouteScreen} />
      <Stack.Screen name="PoseCollectionDetail" component={PoseCollectionDetailRouteScreen} />
      <Stack.Screen name="PoseCamera" component={PoseCameraRouteScreen} options={cameraScreenStackOptions} />
      <Stack.Screen name="PoseCapturePreview" component={PoseCapturePreviewRouteScreen} />
      <Stack.Screen
        name="ImageViewer"
        component={ImageViewerRouteScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}
