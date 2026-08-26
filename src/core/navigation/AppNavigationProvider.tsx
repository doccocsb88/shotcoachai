import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { Alert } from 'react-native';

import { DEFAULT_COACH_MODE, useAnalysisStore } from '../store/analysisStore';
import { PaywallType } from '../../features/paywall/PaywallScreen';
import { LegalDocument } from '../../features/settings/SettingView';
import { AnalysisResult, getFlowType } from '../../models/analysis';
import { getPhotoAiTool } from '../../models/photoAiTool';
import { PhotoRecipe } from '../../models/photoRecipe';
import { Pose } from '../../models/pose';
import { getPhotoRecipe } from '../../services/photo-recipes/photoRecipeLibrary';
import { getAiProcessingConsent, setAiProcessingConsent } from '../../services/storage/aiProcessingConsentStorage';
import { AdsManager } from '../../services/ads/AdsManager';
import { UserManager } from '../../services/user/UserManager';
import { TrackingManager } from '../../services/tracking/TrackingManager';
import { startTrackedCameraFlow, toTrackingFlowType } from '../../services/tracking/trackingFlow';
import {
  createDirectToolResult,
  createPhotoRecipeResult,
  getRecipeFromResult
} from './createFlowResult';
import {
  getCurrentRouteName,
  goBack,
  navigate,
  navigationRef,
  popToScreen,
  resetToHome
} from './navigationRef';
import {
  CameraIntent,
  CameraSource,
  PoseBrowseSource,
  routeNameToTrackingScreen
} from './navigationTypes';

interface AppNavigationContextValue {
  selectedPose: Pose | null;
  selectedRecipe: PhotoRecipe | null;
  imageViewerResult: AnalysisResult | null;
  menuOpen: boolean;
  paywallOpen: boolean;
  paywallType: PaywallType;
  legalDocument: LegalDocument | null;
  cameraIntent: CameraIntent;
  cameraSource: CameraSource;
  poseBrowseSource: PoseBrowseSource;
  currentResult: AnalysisResult | null;
  goHome: () => void;
  openHome: () => void;
  coachReferenceUri: string | null;
  handleCoachReferenceCreated: (uri: string) => void;
  openRetakeCapture: (referenceUri: string) => void;
  openAnalysisResult: (result?: AnalysisResult, openedFromHistory?: boolean) => void;
  openGeneratedResult: (
    suggestionIndex: number,
    result?: AnalysisResult,
    openedFromHistory?: boolean
  ) => void;
  openResultFromHistory: (result: AnalysisResult) => void;
  openCamera: (intent?: CameraIntent, source?: CameraSource) => void;
  openSelectedPreviewFlow: () => void;
  openHistory: () => void;
  openPreview: () => void;
  openRecipeList: (source?: 'home') => void;
  openRecipeDetail: (recipe: PhotoRecipe, source?: string) => void;
  openCurrentRecipeDetail: () => void;
  generateRecipe: (recipe: PhotoRecipe) => Promise<void>;
  handleSelectRecipeFromList: (recipe: PhotoRecipe) => void;
  handlePhotoSelected: () => void;
  handleGeneratedResultBack: () => void;
  openPoseCollection: (source?: 'home' | 'collection') => void;
  openPoseCollectionDetail: (collectionId: string, initialPoseId?: string) => void;
  openPoseFromBrowse: (pose: Pose, source?: PoseBrowseSource) => Promise<void>;
  openFeaturedPose: (pose: Pose) => void;
  openPoseCapturePreview: (photoUri: string) => void;
  finishPoseCapture: () => void;
  returnFromPoseBrowse: () => void;
  openPaywall: (type?: PaywallType, source?: string) => void;
  closePaywall: () => void;
  openPaywallFromSettings: () => void;
  openLegalFromSettings: (document: LegalDocument) => void;
  closeLegalDocument: () => void;
  closeMenu: () => void;
  openMenu: () => void;
  closeImageViewer: () => void;
  setSelectedPose: (pose: Pose | null) => void;
  setInitialCollectionPoseId: (poseId: string | null) => void;
  initialCollectionPoseId: string | null;
}

const AppNavigationContext = createContext<AppNavigationContextValue | null>(null);

export function useAppNavigation() {
  const context = useContext(AppNavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within AppNavigationProvider');
  }
  return context;
}

interface Props {
  children: ReactNode;
}

export function AppNavigationProvider({ children }: Props) {
  const [selectedPose, setSelectedPose] = useState<Pose | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<PhotoRecipe | null>(null);
  const [initialCollectionPoseId, setInitialCollectionPoseId] = useState<string | null>(null);
  const [poseBrowseSource, setPoseBrowseSource] = useState<PoseBrowseSource>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallType, setPaywallType] = useState<PaywallType>('DirectStore');
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const [imageViewerResult, setImageViewerResult] = useState<AnalysisResult | null>(null);
  const [cameraIntent, setCameraIntent] = useState<CameraIntent>({ type: 'coach' });
  const [cameraSource, setCameraSource] = useState<CameraSource>('home');
  const [coachReferenceUri, setCoachReferenceUri] = useState<string | null>(null);

  const hydrateHistory = useAnalysisStore(state => state.hydrateHistory);
  const clearCurrent = useAnalysisStore(state => state.clearCurrent);
  const currentResult = useAnalysisStore(state => state.currentResult);
  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);

  useEffect(() => {
    void hydrateHistory();
    void UserManager.refresh();
  }, [hydrateHistory]);

  const goHome = useCallback(() => {
    void TrackingManager.flow.abandon();
    clearCurrent();
    setCoachReferenceUri(null);
    resetToHome();
  }, [clearCurrent]);

  const openHome = useCallback(() => {
    setCoachReferenceUri(null);
    resetToHome();
  }, []);

  const openAnalysisResult = useCallback(
    (result?: AnalysisResult, openedFromHistory = false) => {
      if (result) {
        void TrackingManager.flow.analysisResultViewed(result.suggestions.length);
        setCurrentResult(result);
      }
      navigate('AnalysisResult', { openedFromHistory });
    },
    [setCurrentResult]
  );

  const openGeneratedResult = useCallback(
    (suggestionIndex: number, result?: AnalysisResult, openedFromHistory = false) => {
      const activeResult = result ?? currentResult;
      if (activeResult) {
        void TrackingManager.flow.suggestionSelected(suggestionIndex, activeResult.suggestions.length);
      }
      if (result) {
        setCurrentResult(result);
      }
      navigate('GeneratedResult', {
        suggestionIndex,
        openedFromHistory,
        canReturnToAnalysis: !openedFromHistory
      });
    },
    [currentResult, setCurrentResult]
  );

  const openResultFromHistory = useCallback((result: AnalysisResult) => {
    void TrackingManager.history.itemOpened(toTrackingFlowType(getFlowType(result)));
    setImageViewerResult(result);
    navigate('ImageViewer');
  }, []);

  const openCamera = useCallback((intent: CameraIntent = { type: 'coach' }, source: CameraSource = 'home') => {
    console.log('[ShotCoach][Navigator][open-camera]', {
      source,
      intentType: intent.type,
      recipeId: intent.type === 'recipe' ? intent.recipeId : undefined,
      toolId: intent.type === 'tool' ? intent.toolId : undefined
    });
    if (intent.type === 'coach' && source === 'home') {
      setCoachReferenceUri(null);
    }
    setCameraIntent(intent);
    setCameraSource(source);
    startTrackedCameraFlow(intent, source);
    navigate('Camera', {
      intent,
      source,
      referenceImageUri: intent.type === 'coach' ? coachReferenceUri : null
    });
  }, [coachReferenceUri]);

  const handleCoachReferenceCreated = useCallback((uri: string) => {
    setCoachReferenceUri(uri);
  }, []);

  const openRetakeCapture = useCallback(
    (_referenceUri: string) => {
      clearCurrent();
      setCoachReferenceUri(null);

      const cameraParams = {
        intent: cameraIntent,
        source: cameraSource,
        referenceImageUri: null
      };

      if (popToScreen('Camera', cameraParams, { merge: true })) {
        return;
      }

      setCameraIntent(cameraIntent);
      setCameraSource(cameraSource);
      startTrackedCameraFlow(cameraIntent, cameraSource);
      navigate('Camera', cameraParams);
    },
    [cameraIntent, cameraSource, clearCurrent]
  );

  const openSelectedPreviewFlow = useCallback(() => {
    const {
      currentPhoto: latestPhoto,
      selectedPhotoAiInstruction: latestInstruction,
      selectedPhotoAiTool: latestToolId
    } = useAnalysisStore.getState();
    const tool = getPhotoAiTool(latestToolId);
    if (tool.id === 'ai_coach') {
      navigate('Analyzing');
      return;
    }

    if (!latestPhoto) {
      openHome();
      return;
    }

    setCurrentResult(createDirectToolResult(latestPhoto, tool, latestInstruction));
    navigate('GeneratedResult', {
      suggestionIndex: 0,
      openedFromHistory: false,
      canReturnToAnalysis: false
    });
  }, [openHome, setCurrentResult]);

  const openHistory = useCallback(() => {
    void TrackingManager.history.opened();
    navigate('History');
  }, []);

  const openPreview = useCallback(() => {
    navigate('Preview');
  }, []);

  const openRecipeList = useCallback((source: 'home' = 'home') => {
    void TrackingManager.flow.recipeListOpened(source);
    navigate('RecipeList', { source });
  }, []);

  const openRecipeDetail = useCallback((recipe: PhotoRecipe, source = 'recipe_list') => {
    void TrackingManager.recipe.detailOpened(recipe.id, source);
    setSelectedRecipe(recipe);
    navigate('RecipeDetail', { recipeId: recipe.id });
  }, []);

  const openCurrentRecipeDetail = useCallback(() => {
    const recipe = getRecipeFromResult(useAnalysisStore.getState().currentResult);
    if (!recipe) return;
    setSelectedRecipe(recipe);
    navigate('RecipeDetail', { recipeId: recipe.id, returnToGeneratedResult: true });
  }, []);

  const startRecipeGeneration = useCallback(
    (recipe: PhotoRecipe) => {
      void TrackingManager.flow.generationStarted({ recipe_id: recipe.id });
      const latestPhoto = useAnalysisStore.getState().currentPhoto;
      if (!latestPhoto) {
        openHome();
        return;
      }
      setSelectedRecipe(recipe);
      setCurrentResult(createPhotoRecipeResult(latestPhoto, recipe));
      navigate('GeneratedResult', {
        suggestionIndex: 0,
        openedFromHistory: false,
        canReturnToAnalysis: false
      });
    },
    [openHome, setCurrentResult]
  );

  const generateRecipe = useCallback(
    async (recipe: PhotoRecipe) => {
      const consentValue = await getAiProcessingConsent();
      if (consentValue) {
        startRecipeGeneration(recipe);
        return;
      }

      Alert.alert(
        'AI Processing Notice',
        'To apply Photo Recipes, the selected photo and recipe prompt will be securely sent to OpenAI for processing.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              void TrackingManager.consent.aiProcessingDeclined('photo_recipe');
            }
          },
          {
            text: 'Continue',
            onPress: () => {
              void TrackingManager.consent.aiProcessingAccepted('photo_recipe');
              void setAiProcessingConsent().then(() => startRecipeGeneration(recipe));
            }
          }
        ]
      );
      void TrackingManager.consent.aiProcessingShown('photo_recipe');
    },
    [startRecipeGeneration]
  );

  const handleSelectRecipeFromList = useCallback(
    (recipe: PhotoRecipe) => {
      void TrackingManager.flow.recipeSelected(recipe.id, 'recipe_list');
      clearCurrent();
      openCamera({ type: 'recipe', recipeId: recipe.id }, 'recipeList');
    },
    [clearCurrent, openCamera]
  );

  const handlePhotoSelected = useCallback(() => {
    if (cameraIntent.type === 'coach') {
      useAnalysisStore.getState().setSelectedPhotoAiTool('ai_coach');
      const photo = useAnalysisStore.getState().currentPhoto;
      if (photo) {
        const directCoachAnalysisId = `direct_coach:${DEFAULT_COACH_MODE}`;
        const dummyResult: AnalysisResult = {
          analysisId: directCoachAnalysisId,
          flowType: 'aiCoach',
          overallAssessment: 'Visual guidance generated by AI Coach.',
          suggestions: [
            {
              title: 'Direct Image Coach',
              concept: 'AI generated visual guidance overlay',
              changes: ['Visual overlay applied'],
              image_prompt: ''
            }
          ],
          createdAt: new Date().toISOString(),
          originalImageUri: photo.uri,
          originalImageMimeType: photo.mimeType
        };
        setCurrentResult(dummyResult);
        navigate('GeneratedResult', {
          suggestionIndex: 0,
          openedFromHistory: false,
          canReturnToAnalysis: false
        });
      } else {
        openHome();
      }
    } else if (cameraIntent.type === 'tool') {
      useAnalysisStore.getState().setSelectedPhotoAiTool(cameraIntent.toolId);
      openPreview();
    } else if (cameraIntent.type === 'recipe') {
      if (cameraIntent.recipeId === 'all') {
        openRecipeList('home');
      } else {
        const recipe = getPhotoRecipe(cameraIntent.recipeId);
        if (recipe) startRecipeGeneration(recipe);
      }
    }
  }, [cameraIntent, coachReferenceUri, openHome, openPreview, openRecipeList, setCurrentResult, startRecipeGeneration]);

  const handleGeneratedResultBack = useCallback(() => {
    goBack();
  }, []);

  const openPoseCollection = useCallback((source: 'home' | 'collection' = 'home') => {
    setInitialCollectionPoseId(null);
    setPoseBrowseSource(source);
    void TrackingManager.pose.collectionOpened(source);
    navigate('PoseCollection', { source });
  }, []);

  const openPoseCollectionDetail = useCallback((collectionId: string, initialPoseId?: string) => {
    setInitialCollectionPoseId(initialPoseId ?? null);
    navigate('PoseCollectionDetail', {
      collectionId,
      initialPoseId,
      browseSource: poseBrowseSource
    });
  }, [poseBrowseSource]);

  const returnFromPoseBrowse = useCallback(() => {
    if (poseBrowseSource === 'home') {
      openHome();
      return;
    }
    if (!navigationRef.isReady()) {
      return;
    }
    if (selectedPose?.collectionId) {
      navigationRef.reset({
        index: 2,
        routes: [
          { name: 'Home' },
          { name: 'PoseCollection', params: { source: 'collection' } },
          {
            name: 'PoseCollectionDetail',
            params: {
              collectionId: selectedPose.collectionId,
              browseSource: 'collection'
            }
          }
        ]
      });
      return;
    }
    navigationRef.reset({
      index: 1,
      routes: [
        { name: 'Home' },
        { name: 'PoseCollection', params: { source: 'collection' } }
      ]
    });
  }, [openHome, poseBrowseSource, selectedPose]);

  const openPoseFromBrowse = useCallback(async (pose: Pose, source: PoseBrowseSource = 'collection') => {
    if (!pose.overlayImage) {
      Alert.alert('Guide coming soon', 'This pose overlay is not available yet.');
      return;
    }
    await AdsManager.showInterstitialIfAppropriate('pose_entry', {
      pose_id: pose.id,
      source
    });
    setSelectedPose(pose);
    setPoseBrowseSource(source);
    void TrackingManager.pose.cameraOpened(pose.id, source);
    navigate('PoseCamera', { browseSource: source });
  }, []);

  const openFeaturedPose = useCallback(
    (pose: Pose) => {
      void openPoseFromBrowse(pose, 'home');
    },
    [openPoseFromBrowse]
  );

  const openPoseCapturePreview = useCallback(
    (photoUri: string) => {
      if (selectedPose) {
        void TrackingManager.pose.captured(selectedPose.id);
      }
      navigate('PoseCapturePreview', { photoUri });
    },
    [selectedPose]
  );

  const finishPoseCapture = useCallback(() => {
    if (selectedPose) {
      void TrackingManager.pose.previewUsed(selectedPose.id);
    }
    void TrackingManager.flow.end('completed');
    returnFromPoseBrowse();
  }, [returnFromPoseBrowse, selectedPose]);

  const openPaywall = useCallback((type: PaywallType = 'DirectStore', source?: string) => {
    void TrackingManager.paywall.opened(source ?? routeNameToTrackingScreen(getCurrentRouteName()), type);
    setPaywallType(type);
    setPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    void TrackingManager.paywall.dismissed(routeNameToTrackingScreen(getCurrentRouteName()));
    setPaywallOpen(false);
    void UserManager.refresh();
  }, []);

  const openPaywallFromSettings = useCallback(() => {
    openPaywall('Store', 'settings');
  }, [openPaywall]);

  const openLegalFromSettings = useCallback((document: LegalDocument) => {
    setLegalDocument(document);
  }, []);

  const closeLegalDocument = useCallback(() => {
    setLegalDocument(null);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);

  const closeImageViewer = useCallback(() => {
    setImageViewerResult(null);
    goBack();
  }, []);

  const value = useMemo<AppNavigationContextValue>(
    () => ({
      selectedPose,
      selectedRecipe,
      imageViewerResult,
      menuOpen,
      paywallOpen,
      paywallType,
      legalDocument,
      cameraIntent,
      cameraSource,
      poseBrowseSource,
      currentResult: currentResult ?? null,
      goHome,
      openHome,
      coachReferenceUri,
      handleCoachReferenceCreated,
      openRetakeCapture,
      openAnalysisResult,
      openGeneratedResult,
      openResultFromHistory,
      openCamera,
      openSelectedPreviewFlow,
      openHistory,
      openPreview,
      openRecipeList,
      openRecipeDetail,
      openCurrentRecipeDetail,
      generateRecipe,
      handleSelectRecipeFromList,
      handlePhotoSelected,
      handleGeneratedResultBack,
      openPoseCollection,
      openPoseCollectionDetail,
      openPoseFromBrowse,
      openFeaturedPose,
      openPoseCapturePreview,
      finishPoseCapture,
      returnFromPoseBrowse,
      openPaywall,
      closePaywall,
      openPaywallFromSettings,
      openLegalFromSettings,
      closeLegalDocument,
      closeMenu,
      openMenu,
      closeImageViewer,
      setSelectedPose,
      setInitialCollectionPoseId,
      initialCollectionPoseId
    }),
    [
      selectedPose,
      selectedRecipe,
      imageViewerResult,
      menuOpen,
      paywallOpen,
      paywallType,
      legalDocument,
      cameraIntent,
      cameraSource,
      poseBrowseSource,
      currentResult,
      goHome,
      openHome,
      coachReferenceUri,
      handleCoachReferenceCreated,
      openRetakeCapture,
      openAnalysisResult,
      openGeneratedResult,
      openResultFromHistory,
      openCamera,
      openSelectedPreviewFlow,
      openHistory,
      openPreview,
      openRecipeList,
      openRecipeDetail,
      openCurrentRecipeDetail,
      generateRecipe,
      handleSelectRecipeFromList,
      handlePhotoSelected,
      handleGeneratedResultBack,
      openPoseCollection,
      openPoseCollectionDetail,
      openPoseFromBrowse,
      openFeaturedPose,
      openPoseCapturePreview,
      finishPoseCapture,
      returnFromPoseBrowse,
      openPaywall,
      closePaywall,
      openPaywallFromSettings,
      openLegalFromSettings,
      closeLegalDocument,
      closeMenu,
      openMenu,
      closeImageViewer,
      initialCollectionPoseId
    ]
  );

  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
}
