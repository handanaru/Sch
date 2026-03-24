import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useRoutineStore } from '../../store/useRoutineStore';
import { useProgressStore } from '../../store/useProgressStore';
import { ScheduleItem } from '../../types';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

export default function ExecuteRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const getRoutineById = useRoutineStore((s) => s.getRoutineById);
  const { startTodayProgress, toggleItemComplete, todayProgress } =
    useProgressStore();

  const routine = getRoutineById(id ?? '');

  const scheduleItems: ScheduleItem[] =
    'scheduleItems' in (routine ?? {})
      ? (routine as any).scheduleItems
      : (routine as any)?.modifiedItems ?? [];

  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!routine) return;
    const progress = startTodayProgress(id ?? '', scheduleItems.length);
    setLocalCompleted(new Set(progress.completedItems));
  }, [id]);

  useEffect(() => {
    if (todayProgress?.routineId === id) {
      setLocalCompleted(new Set(todayProgress.completedItems));
    }
  }, [todayProgress]);

  const handleToggle = (itemId: string) => {
    toggleItemComplete(itemId);
    setLocalCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const completedCount = localCompleted.size;
  const totalCount = scheduleItems.length;
  const completionPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!routine) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>루틴을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const title = 'name' in routine ? (routine as any).name : (routine as any).title;

  return (
    <>
      <Stack.Screen options={{ title: '루틴 실행' }} />
      <View style={styles.container}>
        {/* 진행률 헤더 */}
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{title}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {completedCount}/{totalCount} 완료
            </Text>
            <Text style={styles.progressPercent}>{completionPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${completionPercent}%` }]}
            />
          </View>
        </View>

        {/* 항목 목록 */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {scheduleItems.map((item) => {
            const completed = localCompleted.has(item.id);
            const typeColor =
              (Colors.scheduleTypes as any)[item.type] ?? Colors.scheduleTypes.other;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, completed && styles.itemCardCompleted]}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <View
                    style={[
                      styles.checkbox,
                      completed && styles.checkboxChecked,
                    ]}
                  >
                    {completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
                <View style={styles.itemBody}>
                  <View style={styles.itemHeader}>
                    <Text
                      style={[
                        styles.itemTitle,
                        completed && styles.itemTitleCompleted,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.itemTime}>{item.time}</Text>
                  </View>
                  <Text
                    style={[
                      styles.itemDesc,
                      completed && styles.itemDescCompleted,
                    ]}
                  >
                    {item.description}
                  </Text>
                  <View style={styles.itemMeta}>
                    <View
                      style={[
                        styles.typeDot,
                        { backgroundColor: typeColor },
                      ]}
                    />
                    <Text style={styles.itemDuration}>{item.duration}분</Text>
                    {item.required && (
                      <View style={styles.requiredTag}>
                        <Text style={styles.requiredTagText}>필수</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
          {completionPercent >= 100 ? (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => router.push(`/retrospect/${id}`)}
            >
              <Text style={styles.finishButtonText}>🎉 완료! 회고 작성하기</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.retrospectButton}
              onPress={() => router.push(`/retrospect/${id}`)}
            >
              <Text style={styles.retrospectButtonText}>회고 작성하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing['3xl'],
  },
  progressHeader: {
    backgroundColor: Colors.primary,
    padding: Spacing.base,
    paddingTop: Spacing.sm,
  },
  progressTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  progressPercent: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.progressTrack,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemCardCompleted: {
    opacity: 0.6,
  },
  itemLeft: {
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
  itemBody: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  itemTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  itemTime: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  itemDesc: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  itemDescCompleted: {
    color: Colors.textMuted,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemDuration: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  requiredTag: {
    backgroundColor: Colors.accent + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
  },
  requiredTagText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  finishButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  finishButtonText: {
    color: Colors.textOnAccent,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  retrospectButton: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retrospectButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
