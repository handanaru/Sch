import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Person, Category } from '../../types';
import { CategoryBadge } from '../common/CategoryBadge';
import { DifficultyStars } from '../common/DifficultyStars';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

interface PersonCardProps {
  person: Person;
  category?: Category;
  onPress?: () => void;
  compact?: boolean;
}

export function PersonCard({
  person,
  category,
  onPress,
  compact = false,
}: PersonCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{person.name}</Text>
        {category && <CategoryBadge category={category} size="sm" />}
      </View>
      <Text style={styles.description} numberOfLines={compact ? 1 : 2}>
        {person.shortDescription}
      </Text>
      {!compact && (
        <Text style={styles.tagline} numberOfLines={2}>
          "{person.tagline}"
        </Text>
      )}
      <View style={styles.footer}>
        <DifficultyStars difficulty={person.difficulty} size="sm" />
        <Text style={styles.arrow}>보기 →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  cardCompact: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  arrow: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
