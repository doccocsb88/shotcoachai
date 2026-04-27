import { FlatList, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Screen } from '../../components/common/Screen';
import { colors } from '../../constants/theme';

interface Props {
  onBack: () => void;
}

const poses = [
  {
    title: 'Jump Shot',
    focus: 'Balance, release point, elbow alignment',
    cue: 'Keep feet under shoulders and finish with wrist over the rim.'
  },
  {
    title: 'Free Throw',
    focus: 'Routine, shoulder square, follow-through',
    cue: 'Hold the follow-through until the ball reaches the basket.'
  },
  {
    title: 'Layup',
    focus: 'Last two steps, knee drive, soft touch',
    cue: 'Drive the outside knee up and place the ball high on the glass.'
  },
  {
    title: 'Catch and Shoot',
    focus: 'Shot pocket, quick set, foot turn',
    cue: 'Catch low, rise in one motion, and keep the guide hand quiet.'
  }
];

export function PoseCollectionScreen({ onBack }: Props) {
  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pose Collection</Text>
          <PrimaryButton title="Back" onPress={onBack} variant="ghost" />
        </View>

        <FlatList
          data={poses}
          keyExtractor={item => item.title}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.posePreview}>
                <View style={styles.poseHead} />
                <View style={[styles.poseBody, index % 2 === 0 && styles.poseBodyLean]} />
                <View style={[styles.poseArm, index % 2 === 0 && styles.poseArmHigh]} />
                <View style={styles.poseLeg} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.poseTitle}>{item.title}</Text>
                <Text style={styles.focus}>{item.focus}</Text>
                <Text style={styles.cue}>{item.cue}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  },
  list: {
    gap: 12,
    paddingBottom: 36,
    paddingTop: 20
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14
  },
  posePreview: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    height: 112,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 86
  },
  poseHead: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 20,
    marginBottom: 8,
    width: 20
  },
  poseBody: {
    backgroundColor: colors.textMuted,
    borderRadius: 3,
    height: 42,
    width: 6
  },
  poseBodyLean: {
    transform: [{ rotate: '-10deg' }]
  },
  poseArm: {
    backgroundColor: colors.textMuted,
    borderRadius: 3,
    height: 5,
    position: 'absolute',
    top: 54,
    transform: [{ rotate: '-18deg' }],
    width: 58
  },
  poseArmHigh: {
    top: 44,
    transform: [{ rotate: '-48deg' }]
  },
  poseLeg: {
    backgroundColor: colors.textMuted,
    borderRadius: 3,
    bottom: 22,
    height: 5,
    position: 'absolute',
    transform: [{ rotate: '20deg' }],
    width: 54
  },
  cardText: {
    flex: 1,
    justifyContent: 'center'
  },
  poseTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  focus: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 6
  },
  cue: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  }
});
