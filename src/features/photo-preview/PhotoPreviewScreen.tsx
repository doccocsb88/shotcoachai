import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { AppScreenHeader } from '../../components/common/AppScreenHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import { PHOTO_AI_TOOLS, PhotoAiTool, PhotoAiToolId, getPhotoAiTool } from '../../models/photoAiTool';
import { getAiProcessingConsent, setAiProcessingConsent } from '../../services/storage/aiProcessingConsentStorage';
import { UserManager } from '../../services/user/UserManager';
import { TrackingManager } from '../../services/tracking/TrackingManager';
import { ToolImageIcon, PhotoToolIcon } from '../../components/icons/ToolImageIcon';
import { buildDirectEditInstruction } from './buildDirectEditInstruction';
import { AiProcessingConsentModal } from './components/AiProcessingConsentModal';
import { InstructionEditorStep } from './components/InstructionEditorStep';

interface Props {
  onBack: () => void;
  onAnalyze: () => void;
  onOpenRecipes: () => void;
  onOpenPaywall: () => void;
  initialStep?: PreviewStep;
}

type PreviewStep = 'flows' | 'instructions';

export type { PreviewStep };

const directTools = PHOTO_AI_TOOLS.filter(tool => tool.id !== 'ai_coach');

export function PhotoPreviewScreen({ onBack, onAnalyze, onOpenRecipes, onOpenPaywall, initialStep = 'flows' }: Props) {
  const photo = useAnalysisStore(state => state.currentPhoto);
  const selectedToolId = useAnalysisStore(state => state.selectedPhotoAiTool);
  const setSelectedTool = useAnalysisStore(state => state.setSelectedPhotoAiTool);
  const setSelectedEdit = useAnalysisStore(state => state.setSelectedPhotoAiEdit);
  const setSelectedInstruction = useAnalysisStore(state => state.setSelectedPhotoAiInstruction);
  const { width } = useWindowDimensions();
  const imageWidth = Math.min(width - 40, 440);
  const imageHeight = Math.min(Math.round(imageWidth * 0.67), 260);
  const selectedTool = getPhotoAiTool(selectedToolId === 'ai_coach' ? 'enhance_photo' : selectedToolId);
  const [step, setStep] = useState<PreviewStep>(initialStep);
  const [instruction, setInstruction] = useState('');
  const [selectedQuickSuggestion, setSelectedQuickSuggestion] = useState<string | null>(null);
  const [hasAiProcessingConsent, setHasAiProcessingConsent] = useState<boolean | null>(null);
  const [isConsentVisible, setConsentVisible] = useState(false);
  const [isToolsSheetVisible, setToolsSheetVisible] = useState(false);

  useEffect(() => {
    void TrackingManager.flow.previewOpened(selectedToolId);
  }, [selectedToolId]);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    let isMounted = true;

    getAiProcessingConsent()
      .then(value => {
        if (isMounted) {
          setHasAiProcessingConsent(value);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasAiProcessingConsent(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const runWithConsent = async () => {
    const consentValue = hasAiProcessingConsent ?? await getAiProcessingConsent();
    setHasAiProcessingConsent(consentValue);

    if (consentValue) {
      onAnalyze();
      return;
    }

    setConsentVisible(true);
  };

  const handleConsentContinue = async () => {
    await setAiProcessingConsent();
    setHasAiProcessingConsent(true);
    setConsentVisible(false);
    onAnalyze();
  };

  const handleBackPress = () => {
    if (step === 'instructions' && initialStep !== 'instructions') {
      setStep('flows');
      setToolsSheetVisible(true);
      return;
    }
    onBack();
  };

  const handleCoachFlow = () => {
    setSelectedTool('ai_coach');
    setSelectedInstruction(undefined);
    void runWithConsent();
  };

  const openEditTools = () => {
    setToolsSheetVisible(true);
  };

  const chooseTool = (tool: PhotoAiTool) => {
    setSelectedTool(tool.id);
    setInstruction('');
    setSelectedQuickSuggestion(null);
    setToolsSheetVisible(false);
    setStep('instructions');
  };

  const handleInstructionChange = (value: string) => {
    setInstruction(value);
    if (value.trim() !== selectedQuickSuggestion) {
      setSelectedQuickSuggestion(null);
    }
  };

  const chooseQuickSuggestion = (suggestion: string) => {
    setSelectedQuickSuggestion(suggestion);
    setInstruction(suggestion);
  };

  const generateDirectEdit = () => {
    if (!UserManager.canUseAiTool(selectedTool.id)) {
      onOpenPaywall();
      return;
    }

    const cleanInstruction = buildDirectEditInstruction(
      selectedTool,
      instruction,
      selectedQuickSuggestion
    );
    setSelectedEdit(selectedTool.id, cleanInstruction);
    void runWithConsent();
  };

  if (!photo) {
    return (
      <Screen scroll={false}>
        <View style={styles.previewRoot}>
          <AppScreenHeader title="Improve Your Photo" onBack={onBack} />
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No photo selected</Text>
            <PrimaryButton title="Back" onPress={onBack} variant="secondary" />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.previewRoot}>
        <AppScreenHeader
          title={step === 'instructions' ? selectedTool.title : 'Improve Your Photo'}
          onBack={handleBackPress}
        />

        {step === 'flows' ? (
          <ScrollView contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false}>
            <PhotoPreviewCard
              height={imageHeight}
              uri={photo.uri}
              width={imageWidth}
              onChangePhoto={onBack}
            />

            <FlowCard
              accent="blue"
              title="Photo Coach"
              subtitle="Get pose, framing and lighting guidance for your next shot."
              iconId="ai_coach"
              onPress={handleCoachFlow}
            />

            <FlowCard
              accent="purple"
              title="AI Edit Tools"
              subtitle="Enhance this photo instantly with AI."
              iconId="enhance_photo"
              onPress={openEditTools}
            />

            <FlowCard
              accent="purple"
              title="Photo Recipes"
              subtitle="Apply curated film looks, color, light and mood."
              iconId="restore_color"
              onPress={onOpenRecipes}
            />
          </ScrollView>
        ) : null}

        {step === 'instructions' ? (
          <InstructionEditorStep
            tool={selectedTool}
            instruction={instruction}
            selectedQuickSuggestion={selectedQuickSuggestion}
            isToolLocked={!UserManager.canUseAiTool(selectedTool.id)}
            onInstructionChange={handleInstructionChange}
            onSelectQuickSuggestion={chooseQuickSuggestion}
            onGenerate={generateDirectEdit}
          />
        ) : null}

        <AiProcessingConsentModal
          visible={isConsentVisible}
          onCancel={() => setConsentVisible(false)}
          onContinue={handleConsentContinue}
        />
        <ToolsBottomSheet
          visible={isToolsSheetVisible}
          tools={directTools}
          onClose={() => setToolsSheetVisible(false)}
          onSelectTool={chooseTool}
        />
      </View>
    </Screen>
  );
}

function PhotoPreviewCard({
  uri,
  width,
  height,
  onChangePhoto
}: {
  uri: string;
  width: number;
  height: number;
  onChangePhoto: () => void;
}) {
  return (
    <View style={[styles.imageFrame, { height, width }]}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      <Text style={styles.ratioBadge}>1:1</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onChangePhoto}
        style={({ pressed }) => [styles.changePhotoButton, pressed && styles.pressed]}
      >
        <PhotoToolIcon id="enhance_photo" color={colors.white} size={14} />
        <Text style={styles.changePhotoText}>Change Photo</Text>
      </Pressable>
    </View>
  );
}

function FlowCard({
  title,
  subtitle,
  iconId,
  accent,
  onPress
}: {
  title: string;
  subtitle: string;
  iconId: PhotoAiToolId;
  accent: 'blue' | 'purple';
  onPress: () => void;
}) {
  const isBlue = accent === 'blue';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.flowCard,
        isBlue ? styles.flowCardBlue : styles.flowCardPurple,
        pressed && styles.pressed
      ]}
    >
      {isBlue ? <CoachFlowGradient /> : null}
      <View style={styles.flowIconWrap}>
        <ToolImageIcon id={iconId} size={50} fallbackColor={isBlue ? '#27C0B2' : '#7C3AED'} />
      </View>
      <View style={styles.flowTextWrap}>
        <Text style={styles.flowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.flowSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
      <View style={styles.flowArrow}>
        <Text style={styles.flowArrowText}>›</Text>
      </View>
    </Pressable>
  );
}

function CoachFlowGradient() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="coachFlowGradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#BDF6F3" />
          <Stop offset="1" stopColor="#DCF8E9" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill="url(#coachFlowGradient)" />
    </Svg>
  );
}

function ToolsBottomSheet({
  visible,
  tools,
  onClose,
  onSelectTool
}: {
  visible: boolean;
  tools: PhotoAiTool[];
  onClose: () => void;
  onSelectTool: (tool: PhotoAiTool) => void;
}) {
  const translateY = useRef(new Animated.Value(360)).current;

  const closeWithAnimation = () => {
    Animated.timing(translateY, {
      duration: 180,
      toValue: 360,
      useNativeDriver: true
    }).start(onClose);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          translateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 90 || gestureState.vy > 0.9) {
            closeWithAnimation();
            return;
          }
          Animated.spring(translateY, {
            damping: 18,
            stiffness: 180,
            toValue: 0,
            useNativeDriver: true
          }).start();
        }
      }),
    [translateY]
  );

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(360);
    Animated.spring(translateY, {
      damping: 20,
      stiffness: 180,
      toValue: 0,
      useNativeDriver: true
    }).start();
  }, [translateY, visible]);

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={closeWithAnimation} statusBarTranslucent>
      <View style={styles.sheetRoot}>
        <Pressable accessibilityLabel="Close AI edit tools" accessibilityRole="button" onPress={closeWithAnimation} style={styles.sheetBackdrop} />
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers} style={styles.sheetDragArea}>
            <View style={styles.sheetHandle} />
          </View>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>AI Edit Tools</Text>
              <Text style={styles.sheetSubtitle}>Enhance this photo instantly with AI.</Text>
            </View>
            <Pressable
              accessibilityLabel="Close AI edit tools"
              accessibilityRole="button"
              onPress={closeWithAnimation}
              style={({ pressed }) => [styles.sheetCloseButton, pressed && styles.pressed]}
            >
              <Text style={styles.sheetCloseText}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetToolGrid} showsVerticalScrollIndicator={false}>
            {tools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onPress={() => onSelectTool(tool)} />
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ToolCard({ tool, onPress }: { tool: PhotoAiTool; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
    >
      <View style={styles.toolIconWrap}>
        <ToolImageIcon id={tool.id} size={54} />
      </View>
      <Text style={styles.toolTitle} numberOfLines={1}>{tool.shortTitle}</Text>
      <Text style={styles.toolSubtitle} numberOfLines={2}>{tool.subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  previewRoot: {
    flex: 1
  },
  previewContent: {
    paddingBottom: 26,
    paddingHorizontal: 20,
    paddingTop: 18
  },
  imageFrame: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 14,
    overflow: 'hidden',
    ...shadows.card
  },
  image: {
    height: '100%',
    width: '100%'
  },
  ratioBadge: {
    backgroundColor: 'rgba(11, 27, 52, 0.62)',
    borderRadius: radius.sm,
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: 'absolute',
    right: 10,
    top: 10
  },
  changePhotoButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(11, 27, 52, 0.72)',
    borderRadius: radius.pill,
    bottom: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute'
  },
  changePhotoText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800'
  },
  flowCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: 12,
    minHeight: 116,
    overflow: 'hidden',
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 14
  },
  flowCardBlue: {
    backgroundColor: '#D9F8EC',
    ...shadows.soft
  },
  flowCardPurple: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft
  },
  flowIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 60,
    justifyContent: 'center',
    marginRight: 12,
    width: 60,
    zIndex: 1
  },
  flowTextWrap: {
    flex: 1,
    zIndex: 1
  },
  flowTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 5
  },
  flowSubtitle: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17
  },
  flowArrow: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    marginLeft: 4,
    width: 24,
    zIndex: 1
  },
  flowArrowText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 31,
    marginTop: -2
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 27, 52, 0.36)'
  },
  bottomSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '78%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    paddingHorizontal: 20,
    ...shadows.card
  },
  sheetDragArea: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 10
  },
  sheetHandle: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 5,
    width: 48
  },
  sheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4
  },
  sheetSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  sheetCloseButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    marginLeft: 14,
    width: 38
  },
  sheetCloseText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 31
  },
  sheetToolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 10
  },
  toolCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    width: '48%',
    ...shadows.soft
  },
  toolIconWrap: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    marginBottom: 8,
    width: 54
  },
  toolTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 5,
    textAlign: 'center'
  },
  toolSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center'
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: 24
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.72
  }
});
