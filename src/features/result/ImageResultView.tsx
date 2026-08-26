import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavBarTopInset } from '../../constants/layout';
import { AnalysisResult } from '../../models/analysis';
import { ChevronLeftIcon, DownloadOutlineIcon, ShareOutlineIcon } from '../../components/icons/ResultActionIcons';
import { saveImageToLibrary, shareImage } from '../../services/share/shareGuide';

interface Props {
  result: AnalysisResult;
  onBack: () => void;
}

export function ImageResultView({ result, onBack }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const navBarTopInset = useNavBarTopInset();
  const safeAreaInsets = useSafeAreaInsets();
  const imageUri = result.generatedImageUri ?? result.originalImageUri;

  const handleShare = async () => {
    try {
      await shareImage(imageUri);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not share image');
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveImageToLibrary(imageUri);
      Alert.alert('Saved', 'Image saved to your library!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save image');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: navBarTopInset + 8, minHeight: navBarTopInset + 52 }]}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.iconButton}>
          <ChevronLeftIcon color="#fff" size={28} />
        </Pressable>
      </View>
      
      <Image 
        source={{ uri: imageUri }} 
        style={styles.image} 
        resizeMode="contain" 
      />

      <View style={[styles.footer, { paddingBottom: safeAreaInsets.bottom + 20 }]}>
        <Pressable onPress={handleSave} style={styles.iconButton} hitSlop={12}>
          <DownloadOutlineIcon color="#fff" size={26} />
        </Pressable>
        <Pressable onPress={handleShare} style={styles.iconButton} hitSlop={12}>
          <ShareOutlineIcon color="#fff" size={26} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 10,
  },
  image: {
    flex: 1,
    width: '100%'
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
