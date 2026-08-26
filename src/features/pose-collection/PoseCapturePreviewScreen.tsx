import { useState } from 'react';
import { Alert, Image, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { CaretLeft } from 'phosphor-react-native';

import { PhotoResultActionDock } from '../../components/common/PhotoResultActionDock';
import { Screen } from '../../components/common/Screen';
import { useNavBarTopInset } from '../../constants/layout';
import { colors, radius } from '../../constants/theme';
import { Pose } from '../../models/pose';
import { saveImageToLibrary, shareImage } from '../../services/share/shareGuide';
import { TrackingManager } from '../../services/tracking/TrackingManager';

const IMMERSIVE_BACKGROUND = '#05070B';
const FLOAT_BOTTOM_PADDING = Platform.OS === 'ios' ? 28 : 16;

interface Props {
  pose: Pose;
  photoUri: string;
  onBack: () => void;
  onRetake: () => void;
}

export function PoseCapturePreviewScreen({ pose, photoUri, onBack, onRetake }: Props) {
  const navBarTopInset = useNavBarTopInset();
  const [busy, setBusy] = useState(false);

  const handleRetake = () => {
    void TrackingManager.flow.resultRetake('pose');
    onRetake();
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveImageToLibrary(photoUri);
      void TrackingManager.flow.resultSaved('pose');
      void TrackingManager.pose.previewUsed(pose.id);
      Alert.alert('Saved', 'Photo saved to your library.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Could not save this photo.');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareImage(photoUri);
      void TrackingManager.flow.resultShared('pose');
      void TrackingManager.pose.previewUsed(pose.id);
    } catch (error) {
      Alert.alert('Share failed', error instanceof Error ? error.message : 'Could not share this photo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll={false}>
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

        <LinearGradient
          colors={['rgba(5,7,11,0.72)', 'rgba(5,7,11,0.2)', 'transparent']}
          locations={[0, 0.65, 1]}
          pointerEvents="none"
          style={styles.topFade}
        />
        <LinearGradient
          colors={['transparent', 'rgba(5,7,11,0.35)', 'rgba(5,7,11,0.95)']}
          locations={[0, 0.45, 1]}
          pointerEvents="none"
          style={styles.bottomFade}
        />

        <View style={[styles.topBar, { top: navBarTopInset + 8 }]}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
          >
            <CaretLeft size={24} color={colors.white} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Your shot</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.bottomChrome, { paddingBottom: FLOAT_BOTTOM_PADDING }]}>
          <View style={styles.poseChipOuter}>
            <BlurView intensity={42} tint="dark" style={styles.poseChip}>
              <Text style={styles.poseChipText} numberOfLines={1}>{pose.title}</Text>
            </BlurView>
          </View>

          <PhotoResultActionDock
            variant="immersive"
            busy={busy}
            onRetake={handleRetake}
            onSave={() => {
              void handleSave();
            }}
            onShare={() => {
              void handleShare();
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: IMMERSIVE_BACKGROUND,
    flex: 1,
    overflow: 'hidden'
  },
  topFade: {
    height: 140,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1
  },
  bottomFade: {
    bottom: 0,
    height: '52%',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 3
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  headerTitle: {
    color: colors.white,
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center'
  },
  headerSpacer: {
    width: 44
  },
  bottomChrome: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 3
  },
  poseChipOuter: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    marginBottom: 10,
    marginHorizontal: 16,
    overflow: 'hidden'
  },
  poseChip: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  poseChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.7
  }
});
