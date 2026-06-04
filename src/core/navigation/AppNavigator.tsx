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
  switch (tool.id) {
    case 'enhance_photo':
      return PromptBuilder.enhancePhoto(instruction);
    case 'better_composition':
      return PromptBuilder.compositionOnly(instruction);
    case 'light_color':
      return PromptBuilder.lightColor(instruction);
    case 'upscale':
      return PromptBuilder.upscale(instruction);
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

  skinOnly(instruction?: string): string {
    const userRequest = instruction && instruction.length > 0
      ? `\nUser request:\n${instruction}\n`
      : '';

    return `
Edit the uploaded photo as a realistic ShotCoach AI photo edit.

The uploaded image is the source of truth.
Selected tool: Smooth Skin.

Goal:
Apply natural professional skin retouching while preserving identity, facial structure, realistic texture, and lighting.
${userRequest}
Preserve:
- The same person, identity, facial structure, expression, hairstyle, clothing, accessories, and body shape.
- The original lighting, color temperature, white balance, environment, and scene.
- Realistic anatomy, eyes, lips, eyebrows, eyelashes, and hair detail.

Allowed edits:
- Reduce minor blemishes, acne, redness, uneven texture, and temporary skin imperfections.
- Slightly smooth skin texture while maintaining realistic pores and natural detail.
- Improve overall skin consistency and cleanliness.
- Apply subtle under-eye refinement if natural and realistic.

Do not:
- Change facial structure, face shape, nose, jawline, eyes, lips, age appearance, or expression.
- Create plastic skin, airbrushed skin, porcelain skin, or beauty filter effects.
- Change skin tone significantly.
- Apply makeup, glam retouching, influencer styling, fashion magazine retouching, or cosmetic surgery effects.
- Change hairstyle, clothing, background, lighting, or scene.
- Add text, logos, watermarks, UI, stickers, or extra people.

Output requirement:
The result should look like the same original photograph after a professional natural skin retouch.

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
    background_boost: 'Improve only the existing background depth, detail, and subject separation. Do not replace the location.',
    enhance_photo: 'Apply only minimal quality correction. Do not change crop, pose, face, skin, background, lighting style, color grading, or depth of field.',
    expand_frame: 'Extend the frame naturally around the existing image. Match perspective, texture, lighting, and scene continuity.',
    light_color: 'Correct only light and color. Do not change pose, framing, crop, composition, camera angle, face, clothing, background, weather, lighting style, depth of field, or retouching.',
    remove_object: 'Remove distracting objects when clearly separable and reconstruct the background with matching texture and light.',
    replace_background: 'Replace the background only. Match subject lighting, perspective, edge detail, and color temperature to the new scene.',
    restore_color: 'Restore faded colors and saturation naturally while keeping skin tones realistic.',
    smooth_skin: 'Retouch skin naturally. Preserve pores, face shape, eye detail, hair, and realistic skin tone.',
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
