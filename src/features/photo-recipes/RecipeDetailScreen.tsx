import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ReactNode } from 'react';

import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius, shadows, typography } from '../../constants/theme';
import { XIcon } from '../../components/icons/ResultActionIcons';
import { PhotoRecipe } from '../../models/photoRecipe';
import { translateRecipeParameters } from '../../services/photo-recipes/recipeTranslator';

interface Props {
  recipe: PhotoRecipe;
  onBack: () => void;
  onGenerate: (recipe: PhotoRecipe) => void | Promise<void>;
  showGenerateAction?: boolean;
  asSheet?: boolean;
  onClose?: () => void;
}

export function RecipeDetailScreen({ recipe, onBack, onGenerate, showGenerateAction = true, asSheet, onClose }: Props) {
  const visualIntent = translateRecipeParameters(recipe.recipeParameters);

  const content = (
    <View style={asSheet ? styles.sheetContainer : styles.root}>
      {asSheet ? (
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle} numberOfLines={1}>{recipe.title}</Text>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <XIcon size={24} color={colors.text} />
          </Pressable>
        </View>
      ) : (
        <ScreenNavBar title={recipe.title} leadingLabel="Back" onLeadingPress={onBack} />
      )}
      <ScrollView
          contentContainerStyle={[styles.content, !showGenerateAction && styles.contentWithoutAction]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Image source={recipe.thumbnail} style={styles.heroThumbnail} resizeMode="cover" />
              <View style={styles.heroTextWrap}>
                <Text style={styles.title}>{recipe.title}</Text>
                <Text style={styles.subtitle}>{recipe.subtitle}</Text>
              </View>
            </View>
            <Text style={styles.description}>{recipe.description}</Text>
            <View style={styles.tagRow}>
              {recipe.tags.map(tag => (
                <Text key={tag} style={styles.tag}>{tag}</Text>
              ))}
            </View>
          </View>

          <RecipeSection title="Look">
            <InfoRow label="Mood" value={recipe.promptPreset.mood} />
            <InfoRow label="Palette" value={recipe.promptPreset.colorPalette} />
            <InfoRow label="Lighting" value={recipe.promptPreset.lighting} />
            <InfoRow label="Contrast" value={recipe.promptPreset.contrast} />
            <InfoRow label="Saturation" value={recipe.promptPreset.saturation} />
            <InfoRow label="Grain" value={recipe.promptPreset.grainDescription} />
          </RecipeSection>

          <RecipeSection title="Translated Intent">
            <InfoRow label="Highlights" value={visualIntent.highlightIntent} />
            <InfoRow label="Shadows" value={visualIntent.shadowIntent} />
            <InfoRow label="Color" value={visualIntent.colorIntent} />
            <InfoRow label="Sharpness" value={visualIntent.sharpnessIntent} />
            <InfoRow label="Clarity" value={visualIntent.clarityIntent} />
          </RecipeSection>

          <RecipeSection title="Safety">
            <Text style={styles.safetyText}>
              Preserves identity, outfit, pose, camera angle, composition, and background. Applies only the selected recipe look.
            </Text>
          </RecipeSection>
        </ScrollView>

        {showGenerateAction ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onGenerate(recipe)}
              style={({ pressed }) => [styles.generateButton, pressed && styles.pressed]}
            >
              <Text style={styles.generateButtonText}>Apply Recipe</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
  );

  if (asSheet) {
    return content;
  }

  return <Screen scroll={false}>{content}</Screen>;
}

function RecipeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    flex: 1,
    overflow: 'hidden'
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  sheetTitle: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '900'
  },
  closeButton: {
    padding: 4
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 18
  },
  contentWithoutAction: {
    paddingBottom: 28
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
    ...shadows.soft
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14
  },
  heroThumbnail: {
    borderRadius: radius.md,
    height: 90,
    marginRight: 14,
    width: 64
  },
  heroTextWrap: {
    flex: 1
  },
  title: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: '900',
    marginBottom: 4
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 14
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
    ...shadows.soft
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12
  },
  infoRow: {
    marginBottom: 12
  },
  infoLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4
  },
  infoValue: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  safetyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  actions: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    position: 'absolute',
    right: 0
  },
  generateButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    minHeight: 58,
    justifyContent: 'center',
    ...shadows.button
  },
  generateButtonText: {
    color: colors.white,
    fontSize: typography.button,
    fontWeight: '900'
  },
  pressed: {
    opacity: 0.72
  }
});
