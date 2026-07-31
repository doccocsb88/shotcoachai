import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, ImageBackground, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

import { useAnalysisStore } from '../../core/store/analysisStore';
import { Screen } from '../../components/common/Screen';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { PickedPhoto } from '../../models/analysis';
import { UserAccessState, UserManager } from '../../services/user/UserManager';
import { PHOTO_RECIPES } from '../../services/photo-recipes/photoRecipeLibrary';
import { CrownLockIcon } from '../../components/icons/CrownLockIcon';
import { PHOTO_AI_TOOLS, PhotoAiToolId } from '../../models/photoAiTool';
import { ToolImageIcon } from '../../components/icons/ToolImageIcon';
import { RecipeCard } from '../photo-recipes/components/RecipeCard';

const historyIcon = require('../../../assets/icons/history.png');
const galleryIcon = require('../../../assets/icons/image-gallery.png');

import Svg, { Path, Rect, Circle } from 'react-native-svg';

function CameraSvgIcon({ color = '#1A1A1A', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

export type CameraIntent =
  | { type: 'coach' }
  | { type: 'tool'; toolId: PhotoAiToolId }
  | { type: 'recipe'; recipeId: string };

interface Props {
  onOpenCamera: (intent: CameraIntent) => void;
  onOpenMenu: () => void;
  onOpenHistory: () => void;
  onOpenPaywall: () => void;
  onOpenRecipeList: () => void;
}

const navBarTopPadding = Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + spacing.md;

export function HomeScreen({
  onOpenCamera,
  onOpenMenu,
  onOpenHistory,
  onOpenPaywall,
  onOpenRecipeList
}: Props) {
  const [accessState, setAccessState] = useState<UserAccessState>(UserManager.getState());
  const setCurrentPhoto = useAnalysisStore(state => state.setCurrentPhoto);

  useEffect(() => {
    const unsubscribe = UserManager.subscribe(setAccessState);
    void UserManager.refresh();
    return unsubscribe;
  }, []);



  const handleSelectRecipe = (recipeId: string) => {
    if (!UserManager.canUseRecipe(recipeId)) {
      onOpenPaywall();
      return;
    }
    onOpenCamera({ type: 'recipe', recipeId });
  };

  const featuredRecipes = PHOTO_RECIPES.slice(0, 5);

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: navBarTopPadding }]}>
          <Pressable onPress={onOpenMenu} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Text style={styles.iconText}>☰</Text>
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.greetingText}>Good Morning,</Text>
            <Text style={styles.titleText}>ShotCoach AI</Text>
          </View>
          <Pressable onPress={onOpenHistory} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Image source={historyIcon} style={styles.headerIcon} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroContainer}>
            <Pressable style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]} onPress={() => onOpenCamera({ type: 'coach' })}>
              <LinearGradient colors={['#FFCBA4', '#FF9B9B']} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.heroContent}>
                  <View style={styles.heroIconWrapper}>
                    <CameraSvgIcon color="#1A1A1A" size={28} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>AI Camera Coach</Text>
                    <Text style={styles.heroSubtitle}>Guided compositions & settings</Text>
                  </View>
                </View>
                <View style={styles.heroButton}>
                  <Text style={styles.heroButtonText}>Start Coach</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Edit Tools</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Enhance a photo instantly with AI.</Text>
          
          <View style={styles.toolGrid}>
            {PHOTO_AI_TOOLS.filter(t => t.id !== 'ai_coach').map(tool => (
              <Pressable
                key={tool.id}
                onPress={() => onOpenCamera({ type: 'tool', toolId: tool.id })}
                style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
              >
                <View style={styles.toolIconWrap}>
                  <ToolImageIcon id={tool.id} size={28} />
                </View>
                <Text style={styles.toolTitle} numberOfLines={1}>{tool.shortTitle}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Photo Recipes</Text>
            <Pressable onPress={onOpenRecipeList}>
              <Text style={styles.sectionLink}>See All</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionSubtitle}>Swipe for inspiration</Text>

          <FlatList
            horizontal
            data={featuredRecipes}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesList}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={item}
                isLocked={!UserManager.canUseRecipe(item.id)}
                onPress={() => handleSelectRecipe(item.id)}
                style={styles.recipeCard}
              />
            )}
          />
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FAFAF8',
    flex: 1
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...shadows.soft
  },
  iconText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: -2
  },
  headerIcon: {
    height: 22,
    tintColor: colors.text,
    width: 22
  },
  headerTitleContainer: {
    alignItems: 'center'
  },
  greetingText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600'
  },
  titleText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  scroll: {
    flex: 1
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  heroContainer: {
    marginBottom: spacing.xl
  },
  heroCard: {
    borderRadius: 24,
    height: 140,
    ...shadows.card
  },
  heroGradient: {
    borderRadius: 24,
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between'
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  heroIconWrapper: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    width: 52
  },
  heroTitle: {
    color: '#1A1A1A',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4
  },
  heroSubtitle: {
    color: 'rgba(26,26,26,0.7)',
    fontSize: 14,
    fontWeight: '600'
  },
  heroButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    width: '100%'
  },
  heroButtonText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '800'
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  sectionLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  sectionSubtitle: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.md
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
    marginBottom: spacing.xl,
  },
  toolCard: {
    alignItems: 'center',
    width: '25%',
  },
  toolIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 60,
    justifyContent: 'center',
    marginBottom: 8,
    width: 60,
    ...shadows.soft
  },
  toolTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  recipesList: {
    paddingRight: spacing.lg
  },
  recipeCard: {
    marginRight: spacing.md,
    width: 144
  },
  pressed: {
    opacity: 0.75
  }
});
