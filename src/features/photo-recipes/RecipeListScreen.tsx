import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius } from '../../constants/theme';
import { CrownLockIcon } from '../../components/icons/CrownLockIcon';
import { PhotoRecipe } from '../../models/photoRecipe';
import { PHOTO_RECIPES } from '../../services/photo-recipes/photoRecipeLibrary';
import { UserAccessState, UserManager } from '../../services/user/UserManager';

interface Props {
  onBack: () => void;
  onSelectRecipe: (recipe: PhotoRecipe) => void;
  onOpenPaywall: () => void;
}

const tagIcons: Record<string, string> = {
  Anime: 'A',
  Beach: '~',
  City: '#',
  Daylight: '*',
  Evening: ')',
  Film: '[]',
  Indoor: '^',
  Lifestyle: '::',
  Nature: '+',
  Portrait: 'P',
  Spring: 'Y',
  Summer: '*',
  Travel: 'T',
  Warm: '*'
};

export function RecipeListScreen({ onBack, onSelectRecipe, onOpenPaywall }: Props) {
  const [accessState, setAccessState] = useState<UserAccessState>(UserManager.getState());

  useEffect(() => {
    const unsubscribe = UserManager.subscribe(setAccessState);
    void UserManager.refresh();
    return unsubscribe;
  }, []);

  const handleSelectRecipe = (recipe: PhotoRecipe) => {
    if (!UserManager.canUseRecipe(recipe.id)) {
      onOpenPaywall();
      return;
    }
    onSelectRecipe(recipe);
  };

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <ScreenNavBar title="Photo Recipes" leadingLabel="Back" onLeadingPress={onBack} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.recipeGrid}>
            {PHOTO_RECIPES.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} isLocked={!UserManager.canUseRecipe(recipe.id)} onPress={() => handleSelectRecipe(recipe)} />
            ))}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

function RecipeCard({ recipe, isLocked, onPress }: { recipe: PhotoRecipe; isLocked?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.recipeCard, pressed && styles.pressed]}
    >
      <ImageBackground source={recipe.thumbnail} style={styles.recipeImage} imageStyle={styles.recipeImageInner}>
        {isLocked ? (
          <View style={styles.lockOverlay}>
            <CrownLockIcon color={colors.white} size={16} />
          </View>
        ) : null}
        <View style={styles.recipeOverlay}>
          <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
          <Text style={styles.recipeSubtitle} numberOfLines={2}>{recipe.subtitle}</Text>
          <View style={styles.tagRow}>
            {recipe.tags.slice(0, 2).map(tag => (
              <View key={tag} style={styles.tagItem}>
                <Text style={styles.tagIcon}>{tagIcons[tag] ?? '•'}</Text>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 12,
    paddingTop: 14
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between'
  },
  recipeCard: {
    aspectRatio: 0.62,
    backgroundColor: '#06161B',
    borderRadius: radius.md,
    overflow: 'hidden',
    width: '48%'
  },
  recipeImage: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  recipeImageInner: {
    borderRadius: radius.md
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 6,
    zIndex: 2
  },
  recipeOverlay: {
    backgroundColor: 'rgba(8, 16, 15, 0.72)',
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 10
  },
  recipeTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
    marginBottom: 3
  },
  recipeSubtitle: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 15,
    marginBottom: 8
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  tagItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  tagIcon: {
    color: 'rgba(255, 255, 255, 0.84)',
    fontSize: 12,
    lineHeight: 14
  },
  tagText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.72
  }
});
