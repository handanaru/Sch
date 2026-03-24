import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScheduleItem } from '../../types';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

interface CheckItemProps {
  item: ScheduleItem;
  completed: boolean;
  onToggle: (id: string) => void;
}

export function CheckItem({ item, completed, onToggle }: CheckItemProps) {
  const typeColor =
    (Colors.scheduleTypes as Record<string, string>)[item.type] ??
    Colors.scheduleTypes.other;

  return (
    <TouchableOpacity
      style={[styles.container, completed && styles.containerCompleted]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
          {completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text
            style={[styles.title, completed && styles.titleCompleted]}
          >
            {item.title}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text
          style={[styles.description, completed && styles.descriptionCompleted]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
          <Text style={styles.duration}>{item.duration}분</Text>
          {item.required && (
            <View style={styles.requiredTag}>
              <Text style={styles.requiredText}>필수</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  containerCompleted: {
    opacity: 0.6,
  },
  left: {
    marginRight: Spacing.md,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkmark: {
    color: Colors.textOnAccent,
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  time: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  descriptionCompleted: {
    color: Colors.textMuted,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  duration: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  requiredTag: {
    backgroundColor: Colors.accent + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
  },
  requiredText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '600',
  },
});
