import { useCallback, useEffect, useState } from 'react';
import { Modal, SafeAreaView, StyleSheet } from 'react-native';

import { useAnalysisStore } from '../store/analysisStore';
import { HomeScreen } from '../../features/home/HomeScreen';
import { PhotoPreviewScreen } from '../../features/photo-preview/PhotoPreviewScreen';
import { PoseAssistScreen } from '../../features/pose-assist/PoseAssistScreen';
import { AnalyzingScreen } from '../../features/analysis/AnalyzingScreen';
import { AnalysisResultScreen } from '../../features/result/AnalysisResultScreen';
import { GeneratedResultScreen } from '../../features/result/GeneratedResultScreen';
import { HistoryScreen } from '../../features/history/HistoryScreen';
import { PoseCollectionScreen } from '../../features/pose-collection/PoseCollectionScreen';
import { PoseDetailScreen } from '../../features/pose-collection/PoseDetailScreen';
import { PaywallScreen, PaywallType } from '../../features/paywall/PaywallScreen';
import { LegalDocument, SettingView } from '../../features/settings/SettingView';
import { AppWebView } from '../../components/common/AppWebView';
import { colors } from '../../constants/theme';
import { AnalysisResult, PickedPhoto } from '../../models/analysis';
import { getPhotoAiTool, PhotoAiTool } from '../../models/photoAiTool';
import { PoseSeedItem } from '../../features/pose-collection/types';
import { UserManager } from '../../services/user/UserManager';
import { trackScreenView } from '../../services/tracking/firebaseTracking';

type ScreenName =
  | 'home'
  | 'preview'
  | 'poseAssist'
  | 'analyzing'
  | 'analysisResult'
  | 'generatedResult'
  | 'history'
  | 'poseCollection'
  | 'poseDetail';

export function AppNavigator() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [selectedPose, setSelectedPose] = useState<PoseSeedItem | null>(null);
  const [resultOpenedFromHistory, setResultOpenedFromHistory] = useState(false);
  const [canReturnToAnalysis, setCanReturnToAnalysis] = useState(true);
  const [generatedSuggestionIndex, setGeneratedSuggestionIndex] = useState(0);
  const [retakeReferenceUri, setRetakeReferenceUri] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallType, setPaywallType] = useState<PaywallType>('DirectStore');
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const hydrateHistory = useAnalysisStore(state => state.hydrateHistory);
  const clearCurrent = useAnalysisStore(state => state.clearCurrent);
  const currentResult = useAnalysisStore(state => state.currentResult);
  const currentPhoto = useAnalysisStore(state => state.currentPhoto);
  const selectedPhotoAiTool = useAnalysisStore(state => state.selectedPhotoAiTool);
  const selectedPhotoAiInstruction = useAnalysisStore(state => state.selectedPhotoAiInstruction);
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
    if (typeof result.selectedSuggestionIndex === 'number' && result.generatedImageUri) {
      openGeneratedResult(result.selectedSuggestionIndex, result, true);
      return;
    }
    openAnalysisResult(result, true);
  }, [openAnalysisResult, openGeneratedResult]);

  const openPreview = useCallback(() => {
    setResultOpenedFromHistory(false);
    setCanReturnToAnalysis(true);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('preview');
  }, []);
  const openPoseAssist = useCallback(() => {
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
  const openSelectedPreviewFlow = useCallback(() => {
    const tool = getPhotoAiTool(selectedPhotoAiTool);
    if (tool.id === 'ai_coach') {
      openAnalyzing();
      return;
    }

    if (!currentPhoto) {
      openHome();
      return;
    }

    setCurrentResult(createDirectToolResult(currentPhoto, tool, selectedPhotoAiInstruction));
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setCanReturnToAnalysis(false);
    setScreen('generatedResult');
  }, [currentPhoto, openAnalyzing, openHome, selectedPhotoAiInstruction, selectedPhotoAiTool, setCurrentResult]);
  const openHistory = useCallback(() => setScreen('history'), []);
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

  if (screen === 'preview') {
    content = <PhotoPreviewScreen onBack={openHome} onAnalyze={openSelectedPreviewFlow} />;
  } else if (screen === 'poseAssist') {
    content = <PoseAssistScreen onBack={openHome} onContinue={openPreview} />;
  } else if (screen === 'analyzing') {
    content = <AnalyzingScreen onComplete={openAnalysisResult} onBack={openPreview} onCancel={goHome} />;
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
        onBack={resultOpenedFromHistory ? openHistory : goHome}
        onBackToAnalysis={() => setScreen('analysisResult')}
        onRetake={openRetakeCapture}
        openedFromHistory={resultOpenedFromHistory}
        canReturnToAnalysis={canReturnToAnalysis}
      />
    );
  } else if (screen === 'history') {
    content = <HistoryScreen onBack={openHome} onOpenResult={openResultFromHistory} />;
  } else if (screen === 'poseCollection') {
    content = <PoseCollectionScreen onBack={openHome} onOpenPose={openPoseDetail} />;
  } else if (screen === 'poseDetail' && selectedPose) {
    content = <PoseDetailScreen pose={selectedPose} onBack={openPoseCollection} />;
  } else {
    content = (
      <HomeScreen
        onOpenPreview={openPreview}
        onOpenPoseAssist={openPoseAssist}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenHistory={openHistory}
        onOpenPaywall={openPaywall}
        referenceImageUri={retakeReferenceUri}
      />
    );
  }

  const contentShell = screen === 'home' ? content : <SafeAreaView style={styles.safeContent}>{content}</SafeAreaView>;

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
      <Modal animationType="slide" visible={paywallOpen} onRequestClose={closePaywall} statusBarTranslucent transparent>
        <PaywallScreen onBack={closePaywall} paywallType={paywallType} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeContent: {
    backgroundColor: colors.background,
    flex: 1
  }
});

function createDirectToolResult(photo: PickedPhoto, tool: PhotoAiTool, instruction?: string): AnalysisResult {
  const now = new Date().toISOString();
  const cleanInstruction = instruction?.trim();

  return {
    analysisId: `direct:${tool.id}:${Date.now()}`,
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

function buildDirectToolImagePrompt(tool: PhotoAiTool, instruction?: string): string {
  return [
    buildDirectBasePrompt(tool),
    buildDirectToolPrompt(tool),
    buildDirectUserPrompt(tool, instruction),
    buildDirectOutputPrompt(tool)
  ].join('\n\n').trim();
}

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
  if (tool.id === 'better_composition') {
    return `
Tool goal:
This is a composition-only edit. Improve framing, crop, subject placement, balance, negative space, and minor visual distractions.

Composition constraints:
- Preserve the original location, background, objects, lighting, time of day, weather, white balance, color temperature, contrast, and mood.
- Do not change pose, expression, outfit, background, lighting style, or scene.
- Do not beautify, retouch, reshape, or redesign the face or body.
- Use only crop, reframing, composition balance, subtle subject separation, and very minor local cleanup.
- Avoid cinematic relighting, dramatic grading, golden hour conversion, beauty filters, studio looks, or a new photo shoot.
`.trim();
}

  const constraints: Partial<Record<PhotoAiTool['id'], string>> = {
    background_boost: 'Improve only the existing background depth, detail, and subject separation. Do not replace the location.',
    enhance_photo: 'Improve clarity, exposure, fine detail, natural polish, and overall photo quality without changing identity or scene.',
    expand_frame: 'Extend the frame naturally around the existing image. Match perspective, texture, lighting, and scene continuity.',
    light_color: 'Correct exposure, shadows, contrast, white balance, and color harmony while preserving the original mood.',
    remove_object: 'Remove distracting objects when clearly separable and reconstruct the background with matching texture and light.',
    replace_background: 'Replace the background only. Match subject lighting, perspective, edge detail, and color temperature to the new scene.',
    restore_color: 'Restore faded colors and saturation naturally while keeping skin tones realistic.',
    smooth_skin: 'Retouch skin naturally. Preserve pores, face shape, eye detail, hair, and realistic skin tone.',
    upscale: 'Prioritize detail recovery, clarity, low-noise sharpening, and realistic texture preservation without changing the scene.'
  };

  return `
Tool goal:
${tool.promptFocus}

Tool constraint:
${constraints[tool.id] ?? tool.detail}
`.trim();
}

function buildDirectUserPrompt(tool: PhotoAiTool, instruction?: string): string {
  const fallback = tool.id === 'better_composition'
    ? 'No extra instruction. Improve composition conservatively and naturally.'
    : 'No extra instruction. Apply the tool naturally.';

  return `
User instruction:
${instruction && instruction.length > 0 ? instruction : fallback}
`.trim();
}

function buildDirectOutputPrompt(tool: PhotoAiTool): string {
  if (tool.id === 'better_composition') {
    return `
Output requirement:
The final image must look like the same original photo, carefully recomposed by a professional photographer through better crop, framing, and subject placement, not a new generated scene.
`.trim();
  }

  return `
Output requirement:
Produce a realistic, high-quality photo edit from the provided source image.
`.trim();
}
