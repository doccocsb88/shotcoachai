import { Image, StyleSheet, Text, View } from 'react-native';

import { AppScreenHeader } from '../../components/common/AppScreenHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors, radius, spacing } from '../../constants/theme';
import { Pose } from '../../models/pose';

interface Props {
  pose: Pose;
  photoUri: string;
  onRetake: () => void;
  onDone: () => void;
}

export function PoseCapturePreviewScreen({ pose, photoUri, onRetake, onDone }: Props) {
  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <AppScreenHeader title="Your shot" onBack={onRetake} />
        <View style={styles.content}>
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          <Text style={styles.title}>{pose.title}</Text>
          <Text style={styles.body}>Overlay was only a live guide. This photo is the raw capture.</Text>
        </View>
        <View style={styles.footer}>
          <PrimaryButton title="Retake" onPress={onRetake} variant="secondary" />
          <PrimaryButton title="Use photo" onPress={onDone} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  photo: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    flex: 1,
    width: '100%'
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 16
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6
  },
  footer: {
    gap: 10,
    paddingBottom: spacing.lg,
    paddingHorizontal: 20,
    paddingTop: 12
  }
});
