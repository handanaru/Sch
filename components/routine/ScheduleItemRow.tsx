import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScheduleItem } from '../../types';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

interface ScheduleItemRowProps {
  item: ScheduleItem;
  isLast?: boolean;
}

export function ScheduleItemRow({ item, isLast = false }: ScheduleItemRowProps) {
  const typeColor =
    (Colors.scheduleTypes as Record<string, string>)[item.type] ??
    Colors.scheduleTypes.other;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.time}>{item.time}</Text>
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={[styles.card, { borderLeftColor: typeColor }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.duration}>{item.duration}분</Text>
        </View>
        <Text style={styles.description}>{item.description}</Text>
        {item.required && (
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>필수</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  left: {
    width: 52,
    alignItems: 'center',
  },
  time: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.border,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginLeft: Spacing.sm,
    borderLeftWidth: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  duration: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  requiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '30',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  requiredText: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
});
