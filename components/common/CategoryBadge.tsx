import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category } from '../../types';
import { FontSizes, BorderRadius, Spacing } from '../../constants/fonts';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const isSmall = size === 'sm';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: category.color + '30' },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.icon, isSmall && styles.iconSmall]}>
        {category.icon}
      </Text>
      <Text
        style={[
          styles.text,
          { color: category.color },
          isSmall && styles.textSmall,
        ]}
      >
        {category.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgeSmall: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  icon: {
    fontSize: 13,
  },
  iconSmall: {
    fontSize: 10,
  },
  text: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: FontSizes.xs,
  },
});
