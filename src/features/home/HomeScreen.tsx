import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, ImageBackground, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

import { CoachMode, useAnalysisStore } from '../../core/store/analysisStore';
import { Screen } from '../../components/common/Screen';
import { navBarBottomPadding, navBarTopPadding } from '../../constants/layout';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { PickedPhoto } from '../../models/analysis';
import { UserAccessState, UserManager } from '../../services/user/UserManager';
import { PHOTO_RECIPES } from '../../services/photo-recipes/photoRecipeLibrary';
import { CrownLockIcon } from '../../components/icons/CrownLockIcon';
import { PHOTO_AI_TOOLS, PhotoAiToolId } from '../../models/photoAiTool';
import { ToolImageIcon } from '../../components/icons/ToolImageIcon';
import { RecipeCard } from '../photo-recipes/components/RecipeCard';
import { AdsManager } from '../../services/ads/AdsManager';
import { TrackingManager } from '../../services/tracking/TrackingManager';

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
  | { type: 'coach', mode: CoachMode }
  | { type: 'tool'; toolId: PhotoAiToolId }
  | { type: 'recipe'; recipeId: string };

interface Props {
  onOpenCamera: (intent: CameraIntent) => void;
  onOpenMenu: () => void;
  onOpenHistory: () => void;
  onOpenPaywall: () => void;
  onOpenRecipeList: () => void;
}

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

  const handleNavigation = async (action: () => void) => {
    await AdsManager.showInterstitialIfAppropriate();
    action();
  };

  const handleSelectRecipe = (recipeId: string) => {
    void TrackingManager.home.action('recipe_card', { recipe_id: recipeId });
    if (!UserManager.canUseRecipe(recipeId)) {
      onOpenPaywall();
      return;
    }
    void handleNavigation(() => onOpenCamera({ type: 'recipe', recipeId }));
  };

  const featuredRecipes = PHOTO_RECIPES.slice(0, 5);

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: navBarTopPadding }]}>
          <Pressable onPress={() => { void TrackingManager.home.action('menu'); onOpenMenu(); }} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Text style={styles.iconText}>☰</Text>
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.titleText}>ShotCoach AI</Text>
          </View>
          <Pressable onPress={() => { void TrackingManager.home.action('history'); void handleNavigation(onOpenHistory); }} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Image source={historyIcon} style={styles.headerIcon} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroContainer}>
            <Pressable style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]} onPress={() => { void TrackingManager.home.action('coach_hero'); void handleNavigation(() => onOpenCamera({ type: 'coach', mode: 'composition' })); }}>
              <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.heroContent}>
                  <View style={styles.heroLeftCol}>
                    <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit>Your AI Camera Coach</Text>
                    <Text style={styles.heroSubtitle}>Get real-time guidance{'\n'}for a better shot.</Text>
                    <View style={styles.heroButton}>
                      <Text style={styles.heroButtonText}>Start coaching</Text>
                      <Text style={styles.heroButtonArrow}>→</Text>
                    </View>
                  </View>
                  <View style={styles.heroRightCol}>
                    <CameraSvgIcon color="#FFFFFF" size={80} />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick edit</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Enhance a photo instantly with AI.</Text>
          
          <View style={styles.toolGrid}>
            {PHOTO_AI_TOOLS.filter(t => t.id !== 'ai_coach').map(tool => (
              <Pressable
                key={tool.id}
                onPress={() => {
                  void TrackingManager.home.action('quick_edit', { tool_id: tool.id });
                  void handleNavigation(() => onOpenCamera({ type: 'tool', toolId: tool.id }));
                }}
                style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}
              >
                <View style={styles.toolIconWrap}>
                  <ToolImageIcon id={tool.id} size={34} />
                </View>
                <Text style={styles.toolTitle} numberOfLines={1}>{tool.shortTitle}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured recipes</Text>
            <Pressable onPress={() => { void TrackingManager.home.action('recipe_see_all'); void handleNavigation(onOpenRecipeList); }}>
              <Text style={styles.sectionLink}>See All</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionSubtitle}>Try a look in one tap</Text>

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
    paddingBottom: navBarBottomPadding
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
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
  titleText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
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
    marginBottom: 32
  },
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    ...shadows.card
  },
  heroGradient: {
    flex: 1,
    padding: spacing.lg,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  heroLeftCol: {
    flex: 1,
    paddingRight: spacing.md
  },
  heroRightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 22
  },
  heroButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start'
  },
  heroButtonText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 6
  },
  heroButtonArrow: {
    color: '#2563EB',
    fontSize: 18,
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
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  sectionLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2
  },
  sectionSubtitle: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 20
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 20,
    marginBottom: 32,
  },
  toolCard: {
    alignItems: 'center',
    width: '20%',
  },
  toolIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    marginBottom: 8,
    width: 58,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2
  },
  toolTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
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
  },

});
