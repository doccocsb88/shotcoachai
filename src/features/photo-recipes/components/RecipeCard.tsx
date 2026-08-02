import { ImageBackground, Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';

import { colors, radius } from '../../../constants/theme';
import { CrownLockIcon } from '../../../components/icons/CrownLockIcon';
import { PhotoRecipe } from '../../../models/photoRecipe';

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

interface Props {
  recipe: PhotoRecipe;
  isLocked?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function RecipeCard({ recipe, isLocked, onPress, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.recipeCard, style, pressed && styles.pressed]}
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
  recipeCard: {
    aspectRatio: 0.62,
    backgroundColor: '#06161B',
    borderRadius: radius.md,
    overflow: 'hidden'
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
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    marginBottom: 2
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
