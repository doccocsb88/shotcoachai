import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/theme';
import { formatScore, getScoreLabel } from '../../utils/score';

interface Props {
  score: number;
}

export function ScoreCard({ score }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Overall Score</Text>
      <Text style={styles.score}>{formatScore(score)}</Text>
      <Text style={styles.caption}>{getScoreLabel(score)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 18
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8
  },
  score: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '800'
  },
  caption: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4
  }
});
