import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { DailyProgress } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

interface TodayProgressCardProps {
  progress: DailyProgress;
}

export function TodayProgressCard({ progress }: TodayProgressCardProps) {
  const router = useRouter();
  const percent = progress.totalItems > 0
    ? Math.round((progress.completedItems.length / progress.totalItems) * 100)
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>오늘의 진행률</Text>
        <Text style={styles.date}>
          {new Date(progress.date).toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </Text>
      </View>
      <ProgressBar percent={percent} label="완료 항목" />
      <Text style={styles.detail}>
        {progress.completedItems.length} / {progress.totalItems}개 완료
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push(`/execute/${progress.routineId}`)}
        >
          <Text style={styles.continueButtonText}>이어서 실행 →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.retrospectButton}
          onPress={() => router.push(`/retrospect/${progress.routineId}`)}
        >
          <Text style={styles.retrospectButtonText}>회고 ✍️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  date: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  detail: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  continueButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  continueButtonText: {
    color: Colors.textOnAccent,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  retrospectButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retrospectButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
});
