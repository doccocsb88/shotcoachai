import { useEffect, useState } from 'react';

import { useAnalysisStore } from '../store/analysisStore';
import { HomeScreen } from '../../features/home/HomeScreen';
import { PhotoPreviewScreen } from '../../features/photo-preview/PhotoPreviewScreen';
import { AnalyzingScreen } from '../../features/analysis/AnalyzingScreen';
import { ResultScreen } from '../../features/result/ResultScreen';
import { HistoryScreen } from '../../features/history/HistoryScreen';
import { AnalysisResult } from '../../models/analysis';

type ScreenName = 'home' | 'preview' | 'analyzing' | 'result' | 'history';

export function AppNavigator() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const hydrateHistory = useAnalysisStore(state => state.hydrateHistory);
  const clearCurrent = useAnalysisStore(state => state.clearCurrent);
  const currentResult = useAnalysisStore(state => state.currentResult);
  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);

  useEffect(() => {
    void hydrateHistory();
  }, [hydrateHistory]);

  const goHome = () => {
    clearCurrent();
    setScreen('home');
  };

  const openResult = (result?: AnalysisResult) => {
    if (result) {
      setCurrentResult(result);
    }
    setScreen('result');
  };

  if (screen === 'preview') {
    return <PhotoPreviewScreen onBack={() => setScreen('home')} onAnalyze={() => setScreen('analyzing')} />;
  }

  if (screen === 'analyzing') {
    return <AnalyzingScreen onComplete={() => openResult()} onBack={() => setScreen('preview')} />;
  }

  if (screen === 'result' && currentResult) {
    return <ResultScreen result={currentResult} onBack={goHome} />;
  }

  if (screen === 'history') {
    return <HistoryScreen onBack={() => setScreen('home')} onOpenResult={openResult} />;
  }

  return <HomeScreen onOpenPreview={() => setScreen('preview')} onOpenHistory={() => setScreen('history')} />;
}
