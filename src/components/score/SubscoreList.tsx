import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/theme';
import { ScoreCategory } from '../../models/analysis';
import { formatScore, formatScoreName } from '../../utils/score';

interface Props {
  subscores: Partial<Record<ScoreCategory, number>>;
}

export function SubscoreList({ subscores }: Props) {
  const entries = Object.entries(subscores);
  if (!entries.length) return null;

  return (
    <View style={styles.wrap}>
      {entries.map(([key, value]) => (
        <View key={key} style={styles.chip}>
          <Text style={styles.name}>{formatScoreName(key)}</Text>
          <Text style={styles.value}>{formatScore(Number(value))}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  name: {
    color: colors.textMuted,
    fontSize: 12
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2
  }
});
