import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, StyleSheet, View } from 'react-native';

import { useAnalysisStore } from '../store/analysisStore';
import { HomeScreen, CameraIntent } from '../../features/home/HomeScreen';
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
import { PoseDetailScreen } from '../../features/pose-collection/PoseDetailScreen';
import { PhotoPreviewScreen } from '../../features/photo-preview/PhotoPreviewScreen';
import { PaywallScreen, PaywallType } from '../../features/paywall/PaywallScreen';
import { LegalDocument, SettingView } from '../../features/settings/SettingView';
import { AppWebView } from '../../components/common/AppWebView';
import { colors } from '../../constants/theme';
import { AnalysisResult, getFlowType, PickedPhoto } from '../../models/analysis';
import { getPhotoAiTool, PhotoAiTool } from '../../models/photoAiTool';
import { PhotoRecipe } from '../../models/photoRecipe';
import { PoseSeedItem } from '../../features/pose-collection/types';
import { buildPhotoRecipePrompt } from '../../services/photo-recipes/photoRecipePromptBuilder';
import { buildPhotoRecipePromptV2 } from '../../services/photo-recipes/photoRecipePromptBuilderV2';
import { getPhotoRecipe } from '../../services/photo-recipes/photoRecipeLibrary';
import { getAiProcessingConsent, setAiProcessingConsent } from '../../services/storage/aiProcessingConsentStorage';
import { UserManager } from '../../services/user/UserManager';
import { trackScreenView } from '../../services/tracking/firebaseTracking';

type ScreenName =
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
  | 'poseDetail'
  | 'preview';

export function AppNavigator() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [selectedPose, setSelectedPose] = useState<PoseSeedItem | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<PhotoRecipe | null>(null);
  const [resultOpenedFromHistory, setResultOpenedFromHistory] = useState(false);
  const [canReturnToAnalysis, setCanReturnToAnalysis] = useState(true);
  const [generatedSuggestionIndex, setGeneratedSuggestionIndex] = useState(0);
  const [retakeReferenceUri, setRetakeReferenceUri] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallType, setPaywallType] = useState<PaywallType>('DirectStore');
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const [imageViewerResult, setImageViewerResult] = useState<AnalysisResult | null>(null);
  const [cameraIntent, setCameraIntent] = useState<CameraIntent>({ type: 'coach', mode: 'comprehensive' });
  const [recipeListSource, setRecipeListSource] = useState<'home'>('home');
  const [cameraSource, setCameraSource] = useState<'home' | 'recipeList'>('home');
  const hydrateHistory = useAnalysisStore(state => state.hydrateHistory);
  const clearCurrent = useAnalysisStore(state => state.clearCurrent);
  const currentResult = useAnalysisStore(state => state.currentResult);
  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);
  useEffect(() => {
    void hydrateHistory();
    void UserManager.refresh();
  }, [hydrateHistory]);

  useEffect(() => {
    void trackScreenView(screen);
  }, [screen]);

  const goHome = useCallback(() => {
    clearCurrent();
    setResultOpenedFromHistory(false);
    setCanReturnToAnalysis(true);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('home');
  }, [clearCurrent]);

  const openRetakeCapture = useCallback((referenceUri: string) => {
    clearCurrent();
    setResultOpenedFromHistory(false);
    setCanReturnToAnalysis(true);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(referenceUri);
    setScreen('home');
  }, [clearCurrent]);

  const openAnalysisResult = useCallback((result?: AnalysisResult, openedFromHistory = false) => {
    if (result) {
      setCurrentResult(result);
    }
    setResultOpenedFromHistory(openedFromHistory);
    setGeneratedSuggestionIndex(0);
    setCanReturnToAnalysis(true);
    setScreen('analysisResult');
  }, [setCurrentResult]);

  const openGeneratedResult = useCallback((suggestionIndex: number, result?: AnalysisResult, openedFromHistory = false) => {
    if (result) {
      setCurrentResult(result);
    }
    setGeneratedSuggestionIndex(suggestionIndex);
    setResultOpenedFromHistory(openedFromHistory);
    setCanReturnToAnalysis(!openedFromHistory);
    setScreen('generatedResult');
  }, [setCurrentResult]);

  const openResultFromHistory = useCallback((result: AnalysisResult) => {
    setImageViewerResult(result);
  }, []);  const openPoseAssist = useCallback(() => {
    setResultOpenedFromHistory(false);
    setCanReturnToAnalysis(true);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('poseAssist');
  }, []);
  const openAnalyzing = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setCanReturnToAnalysis(true);
    setScreen('analyzing');
  }, []);
  const openHome = useCallback(() => {
    setResultOpenedFromHistory(false);
    setCanReturnToAnalysis(true);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('home');
  }, []);
  const openCamera = useCallback((intent: CameraIntent = { type: 'coach', mode: 'comprehensive' }, source: 'home' | 'recipeList' = 'home') => {
    setResultOpenedFromHistory(false);
    setCanReturnToAnalysis(true);
    setGeneratedSuggestionIndex(0);
    setCameraIntent(intent);
    setCameraSource(source);
    setScreen('camera');
  }, []);
  const openSelectedPreviewFlow = useCallback(() => {
    const {
      currentPhoto: latestPhoto,
      selectedPhotoAiInstruction: latestInstruction,
      selectedPhotoAiTool: latestToolId
    } = useAnalysisStore.getState();
    const tool = getPhotoAiTool(latestToolId);
    if (tool.id === 'ai_coach') {
      openAnalyzing();
      return;
    }

    if (!latestPhoto) {
      openHome();
      return;
    }

    setCurrentResult(createDirectToolResult(latestPhoto, tool, latestInstruction));
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setCanReturnToAnalysis(false);
    setScreen('generatedResult');
  }, [openAnalyzing, openHome, setCurrentResult]);
  const openHistory = useCallback(() => setScreen('history'), []);
  const openPreview = useCallback(() => setScreen('preview'), []);
  const openRecipeList = useCallback((source: 'home' = 'home') => {
    setResultOpenedFromHistory(false);
    setCanReturnToAnalysis(false);
    setGeneratedSuggestionIndex(0);
    setRecipeListSource(source);
    setScreen('recipeList');
  }, []);
  const openRecipeDetail = useCallback((recipe: PhotoRecipe) => {
    setSelectedRecipe(recipe);
    setScreen('recipeDetail');
  }, []);
  const openCurrentRecipeDetail = useCallback(() => {
    const recipe = getRecipeFromResult(useAnalysisStore.getState().currentResult);
    if (!recipe) return;
    openRecipeDetail(recipe);
  }, [openRecipeDetail]);
  const startRecipeGeneration = useCallback((recipe: PhotoRecipe) => {
    const latestPhoto = useAnalysisStore.getState().currentPhoto;
    if (!latestPhoto) {
      openHome();
      return;
    }
    setSelectedRecipe(recipe);
    setCurrentResult(createPhotoRecipeResult(latestPhoto, recipe));
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setCanReturnToAnalysis(false);
    setScreen('generatedResult');
  }, [openHome, setCurrentResult]);
  const generateRecipe = useCallback(async (recipe: PhotoRecipe) => {
    const consentValue = await getAiProcessingConsent();
    if (consentValue) {
      startRecipeGeneration(recipe);
      return;
    }

    Alert.alert(
      'AI Processing Notice',
      'To apply Photo Recipes, the selected photo and recipe prompt will be securely sent to OpenAI for processing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            void setAiProcessingConsent().then(() => startRecipeGeneration(recipe));
          }
        }
      ]
    );
  }, [startRecipeGeneration]);

  const handleSelectRecipeFromList = useCallback((recipe: PhotoRecipe) => {
    const latestPhoto = useAnalysisStore.getState().currentPhoto;
    if (!latestPhoto) {
      openCamera({ type: 'recipe', recipeId: recipe.id }, 'recipeList');
    } else {
      generateRecipe(recipe);
    }
  }, [openCamera, generateRecipe]);
  
  const handlePhotoSelected = useCallback(() => {
    if (cameraIntent.type === 'coach') {
      useAnalysisStore.getState().setSelectedPhotoAiTool('ai_coach');
      if (cameraIntent.mode !== 'comprehensive') {
        const photo = useAnalysisStore.getState().currentPhoto;
        if (photo) {
          const dummyResult: AnalysisResult = {
            analysisId: `direct_coach:${cameraIntent.mode}`,
            flowType: 'aiCoach',
            overallAssessment: `Visual guidance generated for ${cameraIntent.mode} mode.`,
            suggestions: [{
              title: `Direct Image Coach (${cameraIntent.mode})`,
              concept: "AI generated visual guidance overlay",
              changes: ["Visual overlay applied"],
              image_prompt: ""
            }],
            createdAt: new Date().toISOString(),
            originalImageUri: photo.uri,
            originalImageMimeType: photo.mimeType
          };
          setCurrentResult(dummyResult);
          setScreen('generatedResult');
        } else {
          openHome();
        }
      } else {
        openAnalyzing();
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
  }, [cameraIntent, openAnalyzing, openPreview, openSelectedPreviewFlow, startRecipeGeneration, openRecipeList]);

  const handleGeneratedResultBack = useCallback(() => {
    if (resultOpenedFromHistory) return openHistory();
    
    if (canReturnToAnalysis) return setScreen('analysisResult');
    
    // As requested: From Result, Back should go to Camera for Tool and Recipe flows!
    return openCamera(cameraIntent);
  }, [resultOpenedFromHistory, openHistory, canReturnToAnalysis, setScreen, openCamera, cameraIntent]);

  const openPoseCollection = useCallback(() => {
    setResultOpenedFromHistory(false);
    setCanReturnToAnalysis(true);
    setGeneratedSuggestionIndex(0);
    setScreen('poseCollection');
  }, []);
  const openPaywall = useCallback((type: PaywallType = 'DirectStore') => {
    setPaywallType(type);
    setPaywallOpen(true);
  }, []);
  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
    void UserManager.refresh();
  }, []);
  const openPoseDetail = useCallback((pose: PoseSeedItem) => {
    setSelectedPose(pose);
    setScreen('poseDetail');
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  let content;

  const isRecipeFlow = screen === 'recipeList' || screen === 'recipeDetail';
  const isGenericResultFlow = screen === 'generatedResult';

  let backgroundContent;
  if (isRecipeFlow) {
    if (resultOpenedFromHistory) {
      backgroundContent = <HistoryScreen onBack={openHome} onOpenResult={openResultFromHistory} />;
    } else {
      backgroundContent = recipeListSource === 'home' 
        ? <HomeScreen onOpenCamera={openCamera} onOpenMenu={() => setMenuOpen(true)} onOpenHistory={openHistory} onOpenPaywall={openPaywall} onOpenRecipeList={() => openRecipeList('home')} /> 
        : <CameraScreen onBack={openHome} onPhotoSelected={handlePhotoSelected} onOpenPaywall={openPaywall} intent={cameraIntent} />;
    }
  } else if (isGenericResultFlow) {
    if (resultOpenedFromHistory) {
      backgroundContent = <HistoryScreen onBack={openHome} onOpenResult={openResultFromHistory} />;
    } else if (canReturnToAnalysis) {
      backgroundContent = (
        <AnalysisResultScreen
          result={currentResult!}
          onOpenPaywall={openPaywall}
          onBack={goHome}
          onSelectSuggestion={index => openGeneratedResult(index, undefined, false)}
        />
      );
    } else {
      backgroundContent = cameraSource === 'recipeList' 
        ? <RecipeListScreen onBack={openHome} onSelectRecipe={handleSelectRecipeFromList} onOpenPaywall={() => openPaywall('Store')} /> 
        : <CameraScreen onBack={openHome} onPhotoSelected={handlePhotoSelected} onOpenPaywall={openPaywall} intent={cameraIntent} />;
    }
  }

  if (screen === 'poseAssist') {
    content = <PoseAssistScreen onBack={openHome} onContinue={openSelectedPreviewFlow} />;
  } else if (screen === 'preview') {
    content = <PhotoPreviewScreen onBack={() => openCamera(cameraIntent)} onAnalyze={openSelectedPreviewFlow} onOpenRecipes={() => openRecipeList('home')} onOpenPaywall={() => openPaywall('Store')} initialStep="instructions" />;
  } else if (screen === 'analyzing') {
    content = <AnalyzingScreen onComplete={openAnalysisResult} onBack={openHome} onCancel={goHome} />;
  } else if (screen === 'analysisResult' && currentResult) {
    content = (
      <AnalysisResultScreen
        result={currentResult}
        onOpenPaywall={openPaywall}
        onBack={resultOpenedFromHistory ? openHistory : goHome}
        onSelectSuggestion={index => openGeneratedResult(index, undefined, resultOpenedFromHistory)}
      />
    );
  } else if (screen === 'generatedResult' && currentResult) {
    content = (
      <GeneratedResultScreen
        result={currentResult}
        suggestionIndex={generatedSuggestionIndex}
        onBack={handleGeneratedResultBack}
        onBackToAnalysis={() => setScreen('analysisResult')}
        onRetake={openRetakeCapture}
        onOpenRecipeDetail={getRecipeFromResult(currentResult) ? openCurrentRecipeDetail : undefined}
        openedFromHistory={resultOpenedFromHistory}
        canReturnToAnalysis={canReturnToAnalysis}
      />
    );
  } else if (screen === 'history') {
    content = <HistoryScreen onBack={openHome} onOpenResult={openResultFromHistory} />;
  } else if (screen === 'recipeList') {
    content = <RecipeListScreen onBack={openHome} onSelectRecipe={handleSelectRecipeFromList} onOpenPaywall={() => openPaywall('Store')} />;
  } else if (screen === 'recipeDetail' && selectedRecipe) {
    content = (
      <RecipeDetailScreen
        recipe={selectedRecipe}
        onBack={() => {
          if (currentResult && getRecipeFromResult(currentResult)) {
            setScreen('generatedResult');
            return;
          }
          openRecipeList();
        }}
        onGenerate={generateRecipe}
        showGenerateAction={false}
      />
    );
  } else if (screen === 'poseCollection') {
    content = <PoseCollectionScreen onBack={openHome} onOpenPose={openPoseDetail} />;
  } else if (screen === 'poseDetail' && selectedPose) {
    content = <PoseDetailScreen pose={selectedPose} onBack={openPoseCollection} />;
  } else if (screen === 'camera') {
    content = (
      <CameraScreen
        onBack={() => {
          if (cameraSource === 'recipeList') {
            openRecipeList(recipeListSource);
          } else {
            openHome();
          }
        }}
        onPhotoSelected={handlePhotoSelected}
        onOpenPaywall={openPaywall}
        referenceImageUri={retakeReferenceUri}
        intent={cameraIntent}
      />
    );
  } else {
    content = (
      <HomeScreen
        onOpenCamera={openCamera}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenHistory={openHistory}
        onOpenPaywall={openPaywall}
        onOpenRecipeList={() => openRecipeList('home')}
      />
    );
  }

  const contentShell = screen === 'home' || screen === 'camera' || screen === 'generatedResult' ? content : <SafeAreaView style={styles.safeContent}>{isRecipeFlow || isGenericResultFlow ? backgroundContent : content}</SafeAreaView>;

  return (
    <>
      {contentShell}
      <SettingView
        visible={menuOpen}
        onClose={closeMenu}
        onOpenPaywall={() => {
          openPaywall('Store');
        }}
        onOpenLegal={setLegalDocument}
      />
      <AppWebView
        title={legalDocument?.title ?? ''}
        url={legalDocument?.url ?? ''}
        visible={legalDocument !== null}
        onClose={() => setLegalDocument(null)}
      />
      <Modal 
        animationType="slide" 
        visible={isRecipeFlow} 
        statusBarTranslucent
        onRequestClose={() => {
          if (screen === 'recipeDetail') {
            openRecipeList(recipeListSource);
          } else {
            recipeListSource === 'home' ? openHome() : openPreview();
          }
        }}
      >
        <SafeAreaView style={styles.safeContent}>
          {screen === 'recipeList' && <RecipeListScreen onBack={openHome} onSelectRecipe={handleSelectRecipeFromList} onOpenPaywall={() => openPaywall('Store')} />}
          {(screen === 'recipeDetail') && selectedRecipe && (
            <RecipeDetailScreen
              recipe={selectedRecipe}
              onBack={() => openRecipeList(recipeListSource)}
              onGenerate={generateRecipe}
              showGenerateAction={false}
            />
          )}
        </SafeAreaView>

        <Modal animationType="slide" visible={paywallOpen} onRequestClose={closePaywall} statusBarTranslucent transparent>
          <PaywallScreen onBack={closePaywall} paywallType={paywallType} />
        </Modal>
      </Modal>

      <Modal 
        animationType="slide" 
        visible={isGenericResultFlow} 
        statusBarTranslucent
        onRequestClose={handleGeneratedResultBack}
      >
        <View style={styles.fullscreenModalContent}>
          {isGenericResultFlow && content}
        </View>
      </Modal>

      {!(isRecipeFlow || isGenericResultFlow) && (
        <Modal animationType="slide" visible={paywallOpen} onRequestClose={closePaywall} statusBarTranslucent transparent>
          <PaywallScreen onBack={closePaywall} paywallType={paywallType} />
        </Modal>
      )}

      <Modal 
        animationType="slide" 
        visible={!!imageViewerResult} 
        statusBarTranslucent
        onRequestClose={() => setImageViewerResult(null)}
      >
        {imageViewerResult && <ImageResultView result={imageViewerResult} onBack={() => setImageViewerResult(null)} />}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeContent: {
    backgroundColor: colors.background,
    flex: 1
  },
  fullscreenModalContent: {
    flex: 1,
    backgroundColor: colors.background
  }
});

function createDirectToolResult(photo: PickedPhoto, tool: PhotoAiTool, instruction?: string): AnalysisResult {
  const now = new Date().toISOString();
  const cleanInstruction = instruction?.trim();

  return {
    analysisId: `direct:${tool.id}:${Date.now()}`,
    flowType: 'editingTool',
    overallAssessment: tool.detail,
    originalImageUri: photo.uri,
    originalImageMimeType: photo.mimeType,
    createdAt: now,
    suggestions: [
      {
        title: tool.title,
        concept: tool.detail,
        composition: 'Apply this edit directly to the selected photo.',
        camera_angle: 'Preserve the original perspective unless the selected tool requires frame expansion.',
        changes: [tool.subtitle, tool.promptFocus, cleanInstruction ? `User instruction: ${cleanInstruction}` : ''],
        image_prompt: buildDirectToolImagePrompt(tool, cleanInstruction)
      }
    ]
  };
}

function createPhotoRecipeResult(photo: PickedPhoto, recipe: PhotoRecipe): AnalysisResult {
  const now = new Date().toISOString();

  return {
    analysisId: `recipe:${recipe.id}:${Date.now()}`,
    flowType: 'photoRecipe',
    overallAssessment: recipe.description,
    originalImageUri: photo.uri,
    originalImageMimeType: photo.mimeType,
    createdAt: now,
    suggestions: [
      {
        title: recipe.title || recipe.name || 'Photo Recipe',
        concept: recipe.description || recipe.mood || 'Apply photo recipe',
        composition: 'Apply this recipe look without changing composition.',
        camera_angle: 'Preserve the original camera angle and perspective.',
        changes: [
          recipe.subtitle || recipe.name || recipe.title || '',
          `Mood: ${recipe.promptPreset?.mood || recipe.mood || 'Standard'}`,
          recipe.promptPreset?.colorPalette ? `Palette: ${recipe.promptPreset.colorPalette}` : '',
          recipe.tags?.length ? `Tags: ${recipe.tags.join(', ')}` : ''
        ].filter(Boolean) as string[],
        image_prompt: process.env.EXPO_PUBLIC_PHOTO_RECIPE_VERSION === 'v2' 
          ? buildPhotoRecipePromptV2(recipe) 
          : buildPhotoRecipePrompt(recipe)
      }
    ]
  };
}

function getRecipeFromResult(result?: AnalysisResult): PhotoRecipe | undefined {
  if (!result || getFlowType(result) !== 'photoRecipe') return undefined;
  const analysisId = result.sourceAnalysisId ?? result.analysisId;
  const recipeId = analysisId.split(':')[1];
  return recipeId ? getPhotoRecipe(recipeId) : undefined;
}

function buildDirectToolImagePrompt(tool: PhotoAiTool, instruction?: string): string {
  switch (tool.id) {
    case 'enhance_photo':
      return PromptBuilder.enhancePhoto(instruction);
    case 'better_composition':
      return PromptBuilder.compositionOnly(instruction);
    case 'light_color':
      return PromptBuilder.lightColor(instruction);
    case 'upscale':
      return PromptBuilder.upscale(instruction);
    case 'background_boost':
      return PromptBuilder.backgroundBoost(instruction);
    case 'expand_frame':
      return PromptBuilder.expandFrame(instruction);
    case 'replace_background':
      return PromptBuilder.replaceBackground(instruction);
    case 'remove_object':
      return PromptBuilder.removeObject(instruction);
    case 'smooth_skin':
      return PromptBuilder.skinOnly(instruction);
    default:
      return PromptBuilder.genericDirectTool(tool, instruction);
  }
}

const PromptBuilder = {
  enhancePhoto(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser request:\n${instruction}\n`
      : '';

    return `
Edit the uploaded photo conservatively.

The uploaded image is the source of truth.
Selected tool: Enhance Photo.

Goal:
Preserve the exact same photograph while applying only minimal quality improvements.
${userRequest}
Preserve exactly:
- Same person and identity.
- Same face and facial proportions.
- Same expression.
- Same hairstyle.
- Same body shape.
- Same clothing and accessories.
- Same pose.
- Same framing.
- Same camera angle.
- Same background and environment.
- Same lighting direction.
- Same weather and time of day.
- Same white balance and color temperature.

Allowed adjustments:
- Very minor exposure correction.
- Very minor shadow recovery.
- Very minor highlight recovery.
- Mild noise reduction.
- Mild image cleanup.
- Mild overall quality improvement.

Do not:
- Recompose the image.
- Change the crop.
- Change the pose.
- Change the expression.
- Change facial features.
- Add or remove objects.
- Change lighting style.
- Change color grading.
- Change depth of field.
- Change background.
- Beautify the subject.
- Retouch skin.
- Add cinematic effects.

Important:
Treat the image as an existing photograph being lightly corrected, not as a scene to be regenerated.

Output:
Output should appear visually identical to the original image, with only subtle quality improvements.
`.trim();
  },

  compositionOnly(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser request:\n${instruction}\n`
      : '';

    return `
Edit the uploaded photo as a realistic ShotCoach AI photo edit.

The uploaded image is the source of truth.
Selected tool: Better Composition.
This is a composition-only edit.

Goal:
Improve the photo through better crop, framing, subject placement, composition balance, negative space, and minor visual distraction reduction.
${userRequest}
Preserve:
- The same person, identity, face, body shape, hairstyle, clothing, and accessories.
- The original location, background, visible objects, lighting, time of day, weather, white balance, color temperature, contrast, and mood.
- Realistic anatomy, eyes, hands, skin texture, and believable lighting.

Allowed edits:
- Crop and reframe the image.
- Improve subject placement, visual balance, negative space, and visual hierarchy.
- Slightly reduce minor visual distractions only if the scene still looks original.
- Add subtle subject separation only through realistic local clarity, contrast, or depth.

Do not:
- Change pose, expression, camera angle, outfit, hairstyle, background, lighting style, time of day, weather, or scene.
- Beautify, retouch, reshape, relight, recolor, or redesign the face or body.
- Apply cinematic grading, golden hour conversion, studio lighting, beauty filters, fashion/editorial styling, or a new photoshoot look.
- Add text, logos, watermarks, UI, stickers, or extra people.

Output requirement:
The final image must look like the same original photo, carefully cropped and reframed with better subject placement and composition.

It must not look like a new generated scene, a different moment, or a new photo shoot.
`.trim();
  },

  lightColor(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser request:\n${instruction}\n`
      : '';

    return `
Edit the uploaded photo with realistic light and color correction.

The uploaded image is the source of truth.
Selected tool: Light & Color.

Goal:
Improve exposure, tonal balance, white balance, and color accuracy while preserving the same photograph.
${userRequest}
Preserve exactly:
- Same person and identity.
- Same face and expression.
- Same hairstyle.
- Same body shape.
- Same clothing and accessories.
- Same pose.
- Same framing.
- Same camera angle.
- Same background and environment.
- Same scene composition.

Allowed adjustments:
- Exposure correction.
- Shadow recovery.
- Highlight recovery.
- White balance correction.
- Natural color balance.
- Contrast optimization.
- Subtle vibrance adjustment.
- Skin tone accuracy improvement.

Do not:
- Change pose.
- Change framing.
- Change crop.
- Change composition.
- Change camera angle.
- Change facial features.
- Change hairstyle.
- Change clothing.
- Change background.
- Change weather.
- Add cinematic lighting.
- Add dramatic relighting.
- Add artificial bokeh.
- Add filters.
- Add beauty retouching.

Important:
Treat the image as an existing photograph receiving professional color correction and tonal adjustment, not as a scene being regenerated.

Output:
Output should look like the same photo after careful Lightroom-style light and color adjustment.
`.trim();
  },

  upscale(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser request:\n${instruction}\n`
      : '';

    return `
Upscale and restore the uploaded photo conservatively.

The uploaded image is the source of truth.
Selected tool: Upscale 2K/4K.

Goal:
Increase perceived resolution and clean up compression or softness while preserving the exact same image.
${userRequest}
Preserve exactly:
- Same person and identity.
- Same face and facial proportions.
- Same expression.
- Same hairstyle.
- Same body shape.
- Same clothing and accessories.
- Same pose.
- Same framing.
- Same crop.
- Same camera angle.
- Same background and environment.
- Same lighting direction.
- Same white balance and color temperature.
- Same scene mood.

Allowed adjustments:
- Conservative resolution enhancement.
- Mild deblurring.
- Mild compression artifact cleanup.
- Mild noise reduction.
- Mild edge refinement.
- Natural texture preservation.

Do not:
- Change pose.
- Change framing.
- Change crop.
- Change camera angle.
- Change composition.
- Change facial features.
- Reconstruct the face.
- Invent missing facial details.
- Beautify the subject.
- Smooth skin.
- Change skin tone.
- Change hairstyle.
- Change clothing.
- Change background.
- Add or remove objects.
- Change lighting.
- Change color grading.
- Add bokeh.
- Add cinematic effects.

Important:
Treat the image as an existing photograph being conservatively upscaled, not as a new generated image.

Output:
Output should look like the same photo after subtle resolution enhancement and artifact cleanup.
`.trim();
  },

  backgroundBoost(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser request:\n${instruction}\n`
      : '';

    return `
Edit the uploaded photo with conservative background enhancement.

The uploaded image is the source of truth.
Selected tool: Background Boost.

Goal:
Improve the existing background subtly while preserving the exact same person, scene, composition, lighting, and camera perspective.
${userRequest}
Preserve exactly:
- Same person and identity.
- Same face and expression.
- Same hairstyle.
- Same body shape.
- Same clothing and accessories.
- Same pose.
- Same framing.
- Same crop.
- Same camera angle.
- Same background location.
- Same background objects.
- Same lighting direction.
- Same weather and time of day.
- Same white balance and color temperature.
- Same scene mood.

Allowed background-only adjustments:
- Mild background cleanup.
- Mild background clarity improvement.
- Mild background noise reduction.
- Mild background shadow/highlight balancing.
- Subtle background color harmony.
- Subtle subject-background separation.
- Very subtle depth enhancement only if it already exists in the original photo.

Do not:
- Replace the background.
- Change the location.
- Add new objects.
- Remove important existing objects.
- Change architecture, landscape, street, sky, room, train, building, or environment.
- Change pose.
- Change framing.
- Change crop.
- Change camera angle.
- Change the subject.
- Change facial features.
- Beautify the subject.
- Add artificial bokeh.
- Add cinematic lighting.
- Add dramatic color grading.
- Make the subject look cut out or pasted onto the background.

Important:
Treat the image as an existing photograph receiving subtle background cleanup and separation, not as a new generated scene.

Output:
Output should look like the same photo with a cleaner, more naturally balanced background.
`.trim();
  },

  expandFrame(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser request:\n${instruction}\n`
      : '';

    return `
Edit the uploaded photo as a realistic outpaint / expand-frame edit.

The uploaded image is the source of truth.
Selected tool: Expand Frame.

Task:
Expand the frame naturally around the original photo while preserving the exact same captured moment.
${userRequest}
Strict preservation rules:
- Keep the original image content unchanged as much as possible.
- Preserve the same person, identity, face, expression, body shape, hairstyle, clothing, accessories, skin tone, and anatomy.
- Do not change the subject's pose, facial features, outfit, body proportions, or position.
- Preserve the original location, background style, lighting, time of day, weather, white balance, color temperature, contrast, and scene mood.
- Match the original perspective, camera lens feel, depth of field, texture, noise, sharpness, and photographic realism.

Expand-frame rules:
- Only extend the surrounding environment beyond the current image boundaries.
- Continue existing background elements naturally and consistently.
- Do not invent a new location, new objects, extra people, text, logos, UI, stickers, fantasy elements, or editorial styling.
- The expanded areas must look like they were part of the original camera capture.

Allowed edits:
- Fill missing outer areas realistically.
- Make very minor edge blending only if needed.
- Keep the center/original subject and scene visually unchanged.

Not allowed:
- Do not beautify the face.
- Do not retouch skin into a beauty-filter look.
- Do not relight, recolor, recompose, crop, or change the camera angle.
- Do not create a new photoshoot or a newly generated scene.

Output:
A realistic high-quality photo where the frame is expanded naturally, while the original photo remains the source of truth.

Final result must look like the same photo with a wider frame, not a different photo.
`.trim();
  },

  replaceBackground(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser instruction:\n${instruction}\n`
      : '\nUser instruction:\nNo extra instruction. Apply the tool naturally.\n';

    return `
Edit the uploaded photo as a realistic background replacement.

The uploaded image is the source of truth.
Selected tool: Replace Background.

Task:
Replace only the background with a realistic, natural new setting while preserving the original subject unchanged.

Strict subject preservation rules:
- Preserve the exact same person, identity, face, facial structure, expression, age appearance, skin tone identity, hairstyle, hair color, body shape, pose, clothing, accessories, and visible garment details.
- Preserve realistic anatomy, eyes, hands, hair edges, skin texture, and facial details.
- Do not beautify, reshape, retouch, stylize, relight, or redesign the subject.
- Do not change the subject's pose, camera-facing angle, proportions, outfit, hairstyle, or expression.

Background replacement rules:
- Replace the original background only.
- Create a realistic natural background that matches the subject's perspective, lens feel, camera height, depth of field, lighting direction, shadow logic, white balance, color temperature, and image grain.
- Integrate the subject naturally into the new scene with believable edges, contact shadows, ambient light, and depth separation.
- The new background should feel like a real photograph, not a fantasy scene, studio render, poster, or editorial set.

Allowed edits:
- Clean subject-background edges if needed.
- Add realistic depth of field behind the subject if consistent with the original image.
- Adjust only minimal edge lighting or shadow blending required to make the composite believable.

Not allowed:
- Do not change the subject.
- Do not add extra people, text, logos, watermarks, UI, stickers, animals, fantasy objects, or distracting elements.
- Do not apply cinematic relighting, heavy color grading, beauty filters, makeup, fashion styling, or AI influencer effects.
- Do not change the subject's skin tone, face, body shape, clothing, or accessories.
${userRequest}
Output:
A realistic high-quality photo edit where only the background is replaced.
The person must remain immediately recognizable as the same individual.

Final result must look like the same subject naturally photographed in a new realistic background, not a new person or a new photoshoot.
`.trim();
  },

  removeObject(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser instruction:\n${instruction}\n`
      : '\nUser instruction:\nRemove the unwanted object naturally.\n';

    return `
Edit the uploaded photo as a realistic object removal edit.

The uploaded image is the source of truth.

Selected tool: Remove Object.

Priority order:
- Preserve the person's identity.
- Preserve the original environment, lighting, time of day, weather, white balance, color temperature, and scene mood.
- Remove only the unwanted object.
- Reconstruct the affected area naturally while maintaining photo realism.

Strict preservation rules:
- Preserve the exact same person and identity.
- Do not change facial structure, face shape, eyes, nose, lips, jawline, age appearance, skin tone identity, hairstyle, hair color, body shape, or gender presentation.
- Preserve the original clothing and accessories, including colors, patterns, jewelry, shoes, and visible garment details.
- Preserve the original location, background, perspective, composition, camera angle, crop, depth of field, and scene context.
- Preserve the original lighting condition, weather, time of day, white balance, color temperature, contrast, image grain, and overall mood.
- Preserve realistic anatomy, hands, eyes, facial details, skin texture, and hair detail.
- Preserve all important scene elements that are not being removed.

Object removal rules:
- Remove only the unwanted or distracting object.
- Reconstruct the removed area using surrounding visual information.
- Match texture, lighting, perspective, shadows, reflections, blur, noise, and depth of field.
- Maintain natural continuity with nearby objects and surfaces.
- If the object overlaps the subject, preserve the subject accurately and reconstruct only the removed object area.
- If the object cannot be confidently identified, make the smallest reasonable cleanup and keep the image mostly unchanged.

Allowed edits:
- Remove unwanted objects.
- Repair background continuity.
- Reconstruct missing visual information naturally.
- Apply minimal blending required to make the edit invisible.

Not allowed:
- Do not modify the person.
- Do not beautify or redesign the face.
- Do not alter pose, expression, hairstyle, body shape, clothing, or accessories.
- Do not change the background, location, lighting, weather, or scene.
- Do not crop, recompose, relight, recolor, or restyle the image.
- Do not add new objects, people, animals, text, logos, watermarks, UI elements, stickers, or decorative elements.
- Do not create a new scene or reinterpret the photograph.
${userRequest}
Output requirement:
Produce a realistic high-quality photo edit from the provided source image.

The final image must look like the original photograph with the unwanted object naturally removed and the surrounding area realistically reconstructed.

The result must remain the same photo, not a new composition, a new scene, or a newly generated image.
`.trim();
  },

  skinOnly(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser request:\n${instruction}\n`
      : '';

    return `
Edit the uploaded photo as a realistic natural skin retouch.

The uploaded image is the source of truth.
Selected tool: Smooth Skin.

Task:
Improve only temporary skin imperfections while keeping the person, face, lighting, and photo realism unchanged.
${userRequest}
Strict preservation rules:
- Preserve the exact same person, identity, facial structure, expression, age appearance, skin tone identity, hairstyle, clothing, accessories, body shape, and background.
- Preserve the original lighting, white balance, color temperature, contrast, environment, and scene mood.
- Preserve natural facial details including eyes, eyebrows, eyelashes, lips, teeth, hairline, moles, freckles, pores, and realistic skin texture.
- Do not change the shape of the face, nose, jawline, cheeks, eyes, lips, forehead, chin, or neck.

Allowed edits:
- Gently reduce temporary blemishes, acne, redness, small spots, and uneven skin texture.
- Slightly smooth skin texture while keeping visible pores and natural detail.
- Subtly refine under-eye shadows only if it still looks natural.
- Improve skin cleanliness and consistency without changing identity.

Not allowed:
- Do not beautify, reshape, slim, age, de-age, or stylize the face.
- Do not apply makeup, glam retouching, porcelain skin, plastic skin, airbrushed skin, beauty filter effects, or influencer styling.
- Do not significantly brighten, relight, recolor, or change skin tone.
- Do not change hairstyle, outfit, background, lighting, camera angle, crop, or scene.
- Do not add text, logos, watermarks, UI, stickers, or extra people.

Output:
The result must look like the same original photograph with only a subtle natural skin cleanup.

The person must remain immediately recognizable as the same individual.
`.trim();
  },

  genericDirectTool(tool: PhotoAiTool, instruction?: string): string {
    return [
      buildDirectBasePrompt(tool),
      buildDirectToolPrompt(tool),
      buildDirectUserPrompt(instruction),
      buildDirectOutputPrompt()
    ].join('\n\n').trim();
  }
};

function buildDirectBasePrompt(tool: PhotoAiTool): string {
  return `
Edit the uploaded photo as a realistic ShotCoach AI photo edit.

The uploaded image is the source of truth.
Selected tool: ${tool.title}.

Base preservation rules:
- Preserve the same person, identity, face, body shape, hairstyle, clothing, and accessories.
- Preserve realistic anatomy, eyes, hands, skin texture, and believable lighting.
- Do not add text, logos, watermarks, UI, stickers, or extra people.
- Keep the edit focused on the selected tool and avoid unrelated redesign.
`.trim();
}

function buildDirectToolPrompt(tool: PhotoAiTool): string {
  const constraints: Partial<Record<PhotoAiTool['id'], string>> = {
    background_boost: 'Apply only conservative background cleanup and balance. Do not replace the background, change location, add objects, remove important objects, change crop, pose, camera angle, subject, lighting style, or make the subject look pasted in.',
    enhance_photo: 'Apply only minimal quality correction. Do not change crop, pose, face, skin, background, lighting style, color grading, or depth of field.',
    expand_frame: 'Only extend the surrounding environment beyond the current image boundaries. Keep original content, subject, pose, face, crop center, lighting, perspective, and captured moment unchanged.',
    light_color: 'Correct only light and color. Do not change pose, framing, crop, composition, camera angle, face, clothing, background, weather, lighting style, depth of field, or retouching.',
    remove_object: 'Remove only the unwanted object and reconstruct the affected area naturally. Do not modify the person, crop, recompose, relight, recolor, change scene, or add new objects.',
    replace_background: 'Replace only the background. Do not change the subject, face, pose, outfit, skin tone, body shape, hairstyle, expression, or accessories. Composite the same subject into a new realistic background.',
    restore_color: 'Restore faded colors and saturation naturally while keeping skin tones realistic.',
    smooth_skin: 'Improve only temporary skin imperfections. Do not change facial structure, lighting, skin tone identity, hairstyle, outfit, background, camera angle, crop, or overall scene.',
    upscale: 'Conservatively enhance perceived resolution and clean compression or softness. Do not change crop, pose, composition, face, skin, hair, clothing, background, lighting, color grading, or invent missing facial detail.'
  };

  return `
Tool goal:
${tool.promptFocus}

Tool constraint:
${constraints[tool.id] ?? tool.detail}
`.trim();
}

function buildDirectUserPrompt(instruction?: string): string {
  return `
User instruction:
${instruction && instruction.length > 0 ? instruction : 'No extra instruction. Apply the tool naturally.'}
`.trim();
}

function buildDirectOutputPrompt(): string {
  return `
Output requirement:
Produce a realistic, high-quality photo edit from the provided source image.
`.trim();
}
