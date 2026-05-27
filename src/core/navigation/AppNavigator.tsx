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
import { PaywallScreen } from '../../features/paywall/PaywallScreen';
import { LegalDocument, SettingView } from '../../features/settings/SettingView';
import { AppWebView } from '../../components/common/AppWebView';
import { colors } from '../../constants/theme';
import { AnalysisResult } from '../../models/analysis';
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
  const [generatedSuggestionIndex, setGeneratedSuggestionIndex] = useState(0);
  const [retakeReferenceUri, setRetakeReferenceUri] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
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
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('home');
  }, [clearCurrent]);

  const openRetakeCapture = useCallback((referenceUri: string) => {
    clearCurrent();
    setResultOpenedFromHistory(false);
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
    setScreen('analysisResult');
  }, [setCurrentResult]);

  const openGeneratedResult = useCallback((suggestionIndex: number, result?: AnalysisResult, openedFromHistory = false) => {
    if (result) {
      setCurrentResult(result);
    }
    setGeneratedSuggestionIndex(suggestionIndex);
    setResultOpenedFromHistory(openedFromHistory);
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
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('preview');
  }, []);
  const openPoseAssist = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('poseAssist');
  }, []);
  const openAnalyzing = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setScreen('analyzing');
  }, []);
  const openHome = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setRetakeReferenceUri(null);
    setScreen('home');
  }, []);
  const openHistory = useCallback(() => setScreen('history'), []);
  const openPoseCollection = useCallback(() => {
    setResultOpenedFromHistory(false);
    setGeneratedSuggestionIndex(0);
    setScreen('poseCollection');
  }, []);
  const openPaywall = useCallback(() => setPaywallOpen(true), []);
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
    content = <PhotoPreviewScreen onBack={openHome} onAnalyze={openAnalyzing} />;
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
          openPaywall();
        }}
        onOpenLegal={setLegalDocument}
      />
      <AppWebView
        title={legalDocument?.title ?? ''}
        url={legalDocument?.url ?? ''}
        visible={legalDocument !== null}
        onClose={() => setLegalDocument(null)}
      />
      <Modal animationType="slide" visible={paywallOpen} onRequestClose={closePaywall}>
        <PaywallScreen onBack={closePaywall} />
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
