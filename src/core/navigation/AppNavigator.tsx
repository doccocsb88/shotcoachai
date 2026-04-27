import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAnalysisStore } from '../store/analysisStore';
import { HomeScreen } from '../../features/home/HomeScreen';
import { PhotoPreviewScreen } from '../../features/photo-preview/PhotoPreviewScreen';
import { AnalyzingScreen } from '../../features/analysis/AnalyzingScreen';
import { ResultScreen } from '../../features/result/ResultScreen';
import { HistoryScreen } from '../../features/history/HistoryScreen';
import { PoseCollectionScreen } from '../../features/pose-collection/PoseCollectionScreen';
import { colors } from '../../constants/theme';
import { AnalysisResult } from '../../models/analysis';

type ScreenName = 'home' | 'preview' | 'analyzing' | 'result' | 'history' | 'poseCollection';

export function AppNavigator() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const hydrateHistory = useAnalysisStore(state => state.hydrateHistory);
  const clearCurrent = useAnalysisStore(state => state.clearCurrent);
  const currentResult = useAnalysisStore(state => state.currentResult);
  const setCurrentResult = useAnalysisStore(state => state.setCurrentResult);
  useEffect(() => {
    void hydrateHistory();
  }, [hydrateHistory]);

  const goHome = useCallback(() => {
    clearCurrent();
    setScreen('home');
  }, [clearCurrent]);

  const openResult = useCallback((result?: AnalysisResult) => {
    if (result) {
      setCurrentResult(result);
    }
    setScreen('result');
  }, [setCurrentResult]);

  const openPreview = useCallback(() => setScreen('preview'), []);
  const openAnalyzing = useCallback(() => setScreen('analyzing'), []);
  const openHome = useCallback(() => setScreen('home'), []);
  const openPoseCollection = useCallback(() => setScreen('poseCollection'), []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const openFromMenu = useCallback((nextScreen: ScreenName) => {
    setMenuOpen(false);
    setScreen(nextScreen);
  }, []);

  let content;

  if (screen === 'preview') {
    content = <PhotoPreviewScreen onBack={openHome} onAnalyze={openAnalyzing} />;
  } else if (screen === 'analyzing') {
    content = <AnalyzingScreen onComplete={openResult} onBack={openPreview} onCancel={goHome} />;
  } else if (screen === 'result' && currentResult) {
    content = <ResultScreen result={currentResult} onBack={goHome} />;
  } else if (screen === 'history') {
    content = <HistoryScreen onBack={openHome} onOpenResult={openResult} />;
  } else if (screen === 'poseCollection') {
    content = <PoseCollectionScreen onBack={openHome} />;
  } else {
    content = <HomeScreen onOpenPreview={openPreview} onOpenMenu={() => setMenuOpen(true)} />;
  }

  return (
    <>
      {content}
      <SideMenu
        visible={menuOpen}
        onClose={closeMenu}
        onOpenHistory={() => openFromMenu('history')}
        onOpenPoseCollection={() => openFromMenu('poseCollection')}
      />
    </>
  );
}

function SideMenu({
  visible,
  onClose,
  onOpenHistory,
  onOpenPoseCollection
}: {
  visible: boolean;
  onClose: () => void;
  onOpenHistory: () => void;
  onOpenPoseCollection: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.menuRoot}>
        <Pressable accessibilityLabel="Close menu" style={styles.scrim} onPress={onClose} />
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Menu</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <Pressable onPress={onOpenPoseCollection} style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
            <Text style={styles.menuItemTitle}>Pose Collection</Text>
            <Text style={styles.menuItemSubtitle}>Reference poses and shooting cues</Text>
          </Pressable>

          <Pressable
            onPress={onOpenHistory}
            style={({ pressed }) => [styles.menuItem, styles.menuItemSpaced, pressed && styles.pressed]}
          >
            <Text style={styles.menuItemTitle}>History</Text>
            <Text style={styles.menuItemSubtitle}>Past analyses and saved AI edits</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuRoot: {
    flex: 1,
    flexDirection: 'row'
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    flex: 1
  },
  drawer: {
    backgroundColor: colors.background,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    height: '100%',
    left: 0,
    padding: 20,
    paddingTop: 48,
    position: 'absolute',
    top: 0,
    width: '82%'
  },
  drawerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22
  },
  drawerTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42
  },
  closeText: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 32
  },
  menuItem: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14
  },
  menuItemTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  menuItemSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  menuItemSpaced: {
    marginTop: 12
  },
  pressed: {
    opacity: 0.72
  }
});
