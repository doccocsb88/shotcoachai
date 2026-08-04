import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { X } from 'phosphor-react-native';

import { colors, radius, spacing } from '../../constants/theme';
import { CoachPreferences } from '../../models/coachPreferences';
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, SCENE_CONTEXT_OPTIONS } from './coachPreferenceConfig';

type CoachSettingsSheetProps = {
  visible: boolean;
  preferences: CoachPreferences;
  onClose: () => void;
  onApply: (preferences: CoachPreferences) => void;
};

type OptionPillGroupProps<T extends string> = {
  label: string;
  description?: string;
  options: Array<{ id: T; label: string }>;
  selectedId?: T;
  onSelect: (id: T | undefined) => void;
  layout?: 'grid' | 'row';
};

function OptionPillGroup<T extends string>({
  label,
  description,
  options,
  selectedId,
  onSelect,
  layout = 'row'
}: OptionPillGroupProps<T>) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      <View style={layout === 'grid' ? styles.optionGrid : styles.optionRow}>
        {options.map(option => {
          const isSelected = selectedId === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(isSelected ? undefined : option.id)}
              style={({ pressed }) => [
                layout === 'grid' ? styles.gridPill : styles.rowPill,
                isSelected && styles.pillSelected,
                pressed && styles.pressed
              ]}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CoachSettingsSheet({ visible, preferences, onClose, onApply }: CoachSettingsSheetProps) {
  const { width } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const [draft, setDraft] = useState<CoachPreferences>(preferences);
  const cardWidth = Math.min(width - 24, 420);
  const cardHeight = Math.min(width * 1.45, 680);

  useEffect(() => {
    if (visible) {
      setDraft(preferences);
    }
  }, [preferences, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    opacity.setValue(0);
    scale.setValue(0.96);
    Animated.parallel([
      Animated.timing(opacity, {
        duration: 220,
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        damping: 20,
        stiffness: 220,
        toValue: 1,
        useNativeDriver: true
      })
    ]).start();
  }, [opacity, scale, visible]);

  const closeWithAnimation = (nextPreferences?: CoachPreferences) => {
    Animated.parallel([
      Animated.timing(opacity, {
        duration: 160,
        toValue: 0,
        useNativeDriver: true
      }),
      Animated.timing(scale, {
        duration: 160,
        toValue: 0.96,
        useNativeDriver: true
      })
    ]).start(() => {
      if (nextPreferences) {
        onApply(nextPreferences);
      }
      onClose();
    });
  };

  const handleApply = () => {
    closeWithAnimation(draft);
  };

  const handleCancel = () => {
    closeWithAnimation();
  };

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={() => closeWithAnimation()} statusBarTranslucent>
      <View style={styles.overlayRoot}>
        <Pressable
          accessibilityLabel="Close coach settings"
          accessibilityRole="button"
          onPress={() => closeWithAnimation()}
          style={styles.backdrop}
        />

        <Animated.View
          style={[
            styles.floatingCardWrap,
            { width: cardWidth, opacity, transform: [{ scale }] }
          ]}
        >
          <BlurView intensity={Platform.OS === 'ios' ? 48 : 72} tint="light" style={styles.glassCard}>
            <View style={[styles.glassCardInner, { width: cardWidth, height: cardHeight }]}>
              <View style={styles.headerRow}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.title}>Coach Settings</Text>
                  <Text style={styles.subtitle}>
                    Set your shooting context for this session.
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Close coach settings"
                  accessibilityRole="button"
                  onPress={() => closeWithAnimation()}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                >
                  <X size={18} color="#FFFFFF" weight="bold" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.scrollArea}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <OptionPillGroup
                  label="Shooting Context"
                  description="What type of photo are you taking?"
                  options={SCENE_CONTEXT_OPTIONS}
                  selectedId={draft.sceneContext}
                  layout="grid"
                  onSelect={sceneContext => setDraft(current => ({ ...current, sceneContext }))}
                />

                <OptionPillGroup
                  label="Gender"
                  description="For pose and framing suggestions only."
                  options={GENDER_OPTIONS}
                  selectedId={draft.gender}
                  onSelect={gender => setDraft(current => ({ ...current, gender }))}
                />

                <OptionPillGroup
                  label="Age Range"
                  options={AGE_RANGE_OPTIONS}
                  selectedId={draft.ageRange}
                  onSelect={ageRange => setDraft(current => ({ ...current, ageRange }))}
                />
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleApply}
                  style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleCancel}
                  style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 14, 28, 0.42)'
  },
  floatingCardWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2F6BFF',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.22,
        shadowRadius: 28
      },
      android: {
        elevation: 16
      }
    })
  },
  glassCard: {
    borderColor: 'rgba(255, 255, 255, 0.34)',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden'
  },
  glassCardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'column'
  },
  scrollArea: {
    flex: 1
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: spacing.md
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  scrollContent: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  section: {
    marginBottom: spacing.lg
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4
  },
  sectionDescription: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginBottom: spacing.sm
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  gridPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: '30%',
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  rowPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  pillText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  pillTextSelected: {
    color: '#FFFFFF'
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 16
      },
      android: {
        elevation: 6
      }
    })
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 16,
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.84
  }
});
