import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  useWindowDimensions
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import { PHOTO_AI_TOOLS, PhotoAiTool, PhotoAiToolId, getPhotoAiTool } from '../../models/photoAiTool';
import { getAiProcessingConsent, setAiProcessingConsent } from '../../services/storage/aiProcessingConsentStorage';

interface Props {
  onBack: () => void;
  onAnalyze: () => void;
}

type PreviewStep = 'flows' | 'instructions';

const directTools = PHOTO_AI_TOOLS.filter(tool => tool.id !== 'ai_coach');

const editToolIconSources: Partial<Record<PhotoAiToolId, ImageSourcePropType>> = {
  ai_coach: require('../../../assets/icons/ai-edit-tools/ai-coach-teal.png'),
  enhance_photo: require('../../../assets/icons/ai-edit-tools/enhance-photo.png'),
  light_color: require('../../../assets/icons/ai-edit-tools/light-color.png'),
  restore_color: require('../../../assets/icons/ai-edit-tools/restore-color.png'),
  upscale: require('../../../assets/icons/ai-edit-tools/upscale.png'),
  background_boost: require('../../../assets/icons/ai-edit-tools/background-boost.png'),
  replace_background: require('../../../assets/icons/ai-edit-tools/replace-background.png'),
  remove_object: require('../../../assets/icons/ai-edit-tools/remove-object.png'),
  expand_frame: require('../../../assets/icons/ai-edit-tools/expand-frame.png'),
  smooth_skin: require('../../../assets/icons/ai-edit-tools/smooth-skin.png')
};

export function PhotoPreviewScreen({ onBack, onAnalyze }: Props) {
  const photo = useAnalysisStore(state => state.currentPhoto);
  const selectedToolId = useAnalysisStore(state => state.selectedPhotoAiTool);
  const setSelectedTool = useAnalysisStore(state => state.setSelectedPhotoAiTool);
  const setSelectedInstruction = useAnalysisStore(state => state.setSelectedPhotoAiInstruction);
  const { width } = useWindowDimensions();
  const imageWidth = Math.min(width - 40, 440);
  const imageHeight = Math.min(Math.round(imageWidth * 0.67), 260);
  const selectedTool = getPhotoAiTool(selectedToolId === 'ai_coach' ? 'enhance_photo' : selectedToolId);
  const [step, setStep] = useState<PreviewStep>('flows');
  const [instruction, setInstruction] = useState('');
  const [selectedQuickSuggestion, setSelectedQuickSuggestion] = useState<string | null>(null);
  const [hasAiProcessingConsent, setHasAiProcessingConsent] = useState<boolean | null>(null);
  const [isConsentVisible, setConsentVisible] = useState(false);
  const [isToolsSheetVisible, setToolsSheetVisible] = useState(false);

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
    if (step === 'instructions') {
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

  const chooseQuickSuggestion = (suggestion: string) => {
    setSelectedQuickSuggestion(suggestion);
    setInstruction(suggestion);
  };

  const generateDirectEdit = () => {
    const cleanInstruction = instruction.trim() || selectedQuickSuggestion || selectedTool.detail;
    setSelectedTool(selectedTool.id);
    setSelectedInstruction(cleanInstruction);
    void runWithConsent();
  };

  if (!photo) {
    return (
      <Screen scroll={false}>
        <View style={styles.previewRoot}>
          <ScreenNavBar title="Choose What to Do" leadingLabel="Back" onLeadingPress={onBack} />
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
        <ScreenNavBar title={step === 'instructions' ? selectedTool.title : 'Choose What to Do'} leadingLabel="Back" onLeadingPress={handleBackPress} />

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
              title="Analyze with AI Coach"
              subtitle="Get pose, framing and lighting advice before taking another shot."
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
          </ScrollView>
        ) : null}

        {step === 'instructions' ? (
          <ScrollView contentContainerStyle={styles.instructionsContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.instructionsHeader}>
              <View style={styles.instructionsIconWrap}>
                <ToolImageIcon id={selectedTool.id} size={58} />
              </View>
              <Text style={styles.title}>{selectedTool.title}</Text>
              <Text style={styles.subtitle}>{selectedTool.detail}</Text>
            </View>

            <Text style={styles.fieldLabel}>Quick suggestions</Text>
            <View style={styles.quickSuggestionGrid}>
              {(selectedTool.quickSuggestions ?? []).map(suggestion => {
                const selected = selectedQuickSuggestion === suggestion;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={suggestion}
                    onPress={() => chooseQuickSuggestion(suggestion)}
                    style={({ pressed }) => [
                      styles.quickSuggestion,
                      selected && styles.quickSuggestionSelected,
                      pressed && styles.pressed
                    ]}
                  >
                    <Text style={[styles.quickSuggestionText, selected && styles.quickSuggestionTextSelected]}>
                      {suggestion}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Or describe it</Text>
            <View style={styles.inputWrap}>
              <TextInput
                multiline
                maxLength={200}
                onChangeText={value => {
                  setInstruction(value);
                  if (value.trim() !== selectedQuickSuggestion) {
                    setSelectedQuickSuggestion(null);
                  }
                }}
                placeholder={selectedTool.instructionPlaceholder ?? 'Describe what you want to achieve...'}
                placeholderTextColor={colors.textTertiary}
                style={styles.instructionInput}
                textAlignVertical="top"
                value={instruction}
              />
              <Text style={styles.inputCounter}>{instruction.length}/200</Text>
            </View>
          </ScrollView>
        ) : null}

        {step === 'instructions' ? (
          <View style={styles.actions}>
            <PrimaryButton title="Generate" onPress={generateDirectEdit} />
          </View>
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

function ToolImageIcon({
  id,
  size,
  fallbackColor = colors.primary
}: {
  id: PhotoAiToolId;
  size: number;
  fallbackColor?: string;
}) {
  const source = editToolIconSources[id];

  if (source) {
    return <Image source={source} style={{ height: size, width: size }} resizeMode="contain" />;
  }

  return <PhotoToolIcon id={id} color={fallbackColor} size={size} />;
}

function PhotoToolIcon({ id, color, size }: { id: PhotoAiToolId; color: string; size: number }) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2.2
  };

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {id === 'ai_coach' ? (
        <>
          <Circle {...common} cx={12} cy={12} r={8} />
          <Path {...common} d="M12 7v5l3 2" />
        </>
      ) : id === 'light_color' ? (
        <>
          <Path {...common} d="M12 3v2" />
          <Path {...common} d="M12 19v2" />
          <Path {...common} d="M4.2 4.2l1.4 1.4" />
          <Path {...common} d="M18.4 18.4l1.4 1.4" />
          <Circle {...common} cx={12} cy={12} r={4} />
        </>
      ) : id === 'restore_color' ? (
        <>
          <Circle {...common} cx={9} cy={9} r={4} />
          <Circle {...common} cx={15} cy={9} r={4} />
          <Circle {...common} cx={12} cy={15} r={4} />
        </>
      ) : id === 'upscale' ? (
        <>
          <Path {...common} d="M4 14v6h6" />
          <Path {...common} d="M20 10V4h-6" />
          <Path {...common} d="M20 4l-7 7" />
          <Path {...common} d="M4 20l7-7" />
        </>
      ) : id === 'background_boost' ? (
        <>
          <Rect {...common} height={15} rx={3} width={18} x={3} y={5} />
          <Path {...common} d="M6 17l4-4 3 3 2-2 3 3" />
          <Path {...common} d="M8 9h.01" />
        </>
      ) : id === 'replace_background' ? (
        <>
          <Rect {...common} height={15} rx={3} width={18} x={3} y={5} />
          <Path {...common} d="M7 16c1.5-3 6.5-3 8 0" />
          <Path {...common} d="M9 10a3 3 0 0 0 6 0" />
        </>
      ) : id === 'remove_object' ? (
        <>
          <Rect {...common} height={15} rx={3} width={18} x={3} y={5} />
          <Path {...common} d="M8 8l8 8" />
          <Path {...common} d="M16 8l-8 8" />
        </>
      ) : id === 'expand_frame' ? (
        <>
          <Path {...common} d="M9 3H4v5" />
          <Path {...common} d="M15 3h5v5" />
          <Path {...common} d="M9 21H4v-5" />
          <Path {...common} d="M15 21h5v-5" />
          <Rect {...common} height={8} rx={2} width={8} x={8} y={8} />
        </>
      ) : id === 'smooth_skin' ? (
        <>
          <Circle {...common} cx={12} cy={9} r={4} />
          <Path {...common} d="M5 21c1.4-4 12.6-4 14 0" />
          <Path {...common} d="M17 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
        </>
      ) : (
        <>
          <Rect {...common} height={15} rx={3} width={18} x={3} y={5} />
          <Path {...common} d="M7 16l3-3 2 2 4-5 3 6" />
        </>
      )}
    </Svg>
  );
}

function AiProcessingConsentModal({
  visible,
  onCancel,
  onContinue
}: {
  visible: boolean;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Cancel AI processing consent"
          accessibilityRole="button"
          onPress={onCancel}
          style={styles.modalBackdrop}
        />
        <View style={styles.consentCard}>
          <Text style={styles.consentTitle}>AI Processing Notice</Text>
          <Text style={styles.consentBody}>
            To provide AI-powered photo analysis and preview generation, selected photos will be securely sent to OpenAI for processing.
          </Text>

          <View style={styles.consentSection}>
            <Text style={styles.consentSectionTitle}>Data shared:</Text>
            <ConsentBullet text="Selected photos" />
            <ConsentBullet text="Photography instructions" />
          </View>

          <View style={styles.consentSection}>
            <Text style={styles.consentSectionTitle}>Purpose:</Text>
            <ConsentBullet text="Photo analysis" />
            <ConsentBullet text="Pose recommendations" />
            <ConsentBullet text="AI-generated previews" />
          </View>

          <Text style={styles.consentBody}>By continuing, you consent to this processing.</Text>

          <View style={styles.consentActions}>
            <PrimaryButton title="Continue" onPress={onContinue} />
            <PrimaryButton title="Cancel" onPress={onCancel} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConsentBullet({ text }: { text: string }) {
  return (
    <View style={styles.consentBulletRow}>
      <Text style={styles.consentBullet}>•</Text>
      <Text style={styles.consentBulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  previewRoot: {
    flex: 1,
    paddingTop: Platform.select({ android: StatusBar.currentHeight ?? 0, ios: 0 })
  },
  previewContent: {
    paddingBottom: 26,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  instructionsContent: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 22
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
  sectionHeader: {
    marginBottom: 14,
    marginTop: 8
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
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
    minHeight: 138,
    padding: 14,
    width: '48%',
    ...shadows.soft
  },
  toolIconWrap: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 62,
    justifyContent: 'center',
    marginBottom: 8,
    width: 62
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
  instructionsHeader: {
    alignItems: 'center',
    marginBottom: 24
  },
  instructionsIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    height: 62,
    justifyContent: 'center',
    marginBottom: 14,
    width: 62
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
    marginTop: 8
  },
  quickSuggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  quickSuggestion: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  quickSuggestionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  quickSuggestionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800'
  },
  quickSuggestionTextSelected: {
    color: colors.white
  },
  inputWrap: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 150,
    padding: 14,
    ...shadows.soft
  },
  instructionInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    minHeight: 104
  },
  inputCounter: {
    alignSelf: 'flex-end',
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '800'
  },
  actions: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 14
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center'
  },
  modalRoot: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 27, 52, 0.42)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  consentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxWidth: 420,
    padding: 22,
    width: '100%',
    ...shadows.card
  },
  consentTitle: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '900',
    marginBottom: 12
  },
  consentBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  consentSection: {
    marginTop: 18
  },
  consentSectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8
  },
  consentBulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6
  },
  consentBullet: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 22
  },
  consentBulletText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 15,
    lineHeight: 22
  },
  consentActions: {
    gap: 10,
    marginTop: 22
  },
  pressed: {
    opacity: 0.72
  }
});
