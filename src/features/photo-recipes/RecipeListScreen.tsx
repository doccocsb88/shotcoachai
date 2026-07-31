import { useEffect, useState } from 'react';
import { FlatList, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/common/Screen';
import { ScreenNavBar } from '../../components/common/ScreenNavBar';
import { colors, radius } from '../../constants/theme';
import { PhotoRecipe } from '../../models/photoRecipe';
import { PHOTO_RECIPES } from '../../services/photo-recipes/photoRecipeLibrary';
import { UserAccessState, UserManager } from '../../services/user/UserManager';
import { RecipeCard } from './components/RecipeCard';

interface Props {
  onBack: () => void;
  onSelectRecipe: (recipe: PhotoRecipe) => void;
  onOpenPaywall: () => void;
}


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
        <FlatList
          data={PHOTO_RECIPES}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.recipeGridRow}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              isLocked={!UserManager.canUseRecipe(item.id)}
              onPress={() => handleSelectRecipe(item)}
              style={styles.gridItem}
            />
          )}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 12,
    paddingTop: 14
  },
  recipeGridRow: {
    justifyContent: 'space-between',
    marginBottom: 12
  },
  gridItem: {
    width: '48%'
  }
});
