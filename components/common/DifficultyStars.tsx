import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing } from '../../constants/fonts';

interface DifficultyStarsProps {
  difficulty: 1 | 2 | 3 | 4 | 5;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function DifficultyStars({
  difficulty,
  showLabel = true,
  size = 'md',
}: DifficultyStarsProps) {
  const fontSize = size === 'sm' ? 9 : 12;

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text
          key={i}
          style={[
            styles.dot,
            { fontSize, color: i < difficulty ? Colors.accent : Colors.border },
          ]}
        >
          ●
        </Text>
      ))}
      {showLabel && (
        <Text style={[styles.label, { fontSize: size === 'sm' ? FontSizes.xs : FontSizes.sm }]}>
          난이도 {difficulty}/5
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dot: {},
  label: {
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
});
