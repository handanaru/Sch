import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getRoutineById, getRoutinesByPersonId } from '../../data/routines';
import { getPersonById } from '../../data/persons';
import { getCategoryById } from '../../data/categories';
import { useRoutineStore } from '../../store/useRoutineStore';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';
import { ScheduleItem } from '../../types';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { createUserRoutineFromBase, saveUserRoutine } = useRoutineStore();

  const routine = getRoutineById(id ?? '');
  const person = routine ? getPersonById(routine.personId) : null;
  const category = person ? getCategoryById(person.category) : null;
  const alternateRoutines = routine
    ? getRoutinesByPersonId(routine.personId).filter((r) => r.id !== routine.id)
    : [];

  const [selectedVersion, setSelectedVersion] = useState<'original' | 'realistic'>(
    routine?.versionType ?? 'original'
  );

  const displayRoutine =
    selectedVersion === routine?.versionType
      ? routine
      : alternateRoutines[0] ?? routine;

  if (!routine || !person) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>루틴을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const handleSaveAsMyRoutine = () => {
    Alert.prompt(
      '내 루틴으로 저장',
      '루틴 이름을 입력하세요',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '저장',
          onPress: (name) => {
            if (!name?.trim()) return;
            const newRoutine = createUserRoutineFromBase(
              displayRoutine?.id ?? routine.id,
              name.trim()
            );
            saveUserRoutine(newRoutine);
            Alert.alert('저장 완료', `"${name}" 루틴이 저장되었습니다!`, [
              {
                text: '실행하기',
                onPress: () => router.push(`/execute/${newRoutine.id}`),
              },
              { text: '확인' },
            ]);
          },
        },
      ],
      'plain-text',
      `${person.name}의 루틴`
    );
  };

  const typeColors: Record<string, string> = Colors.scheduleTypes;

  const getTypeColor = (type: string) =>
    typeColors[type] ?? Colors.scheduleTypes.other;

  return (
    <>
      <Stack.Screen
        options={{ title: `${person.name}의 루틴` }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 인물 정보 */}
        <View style={styles.personCard}>
          <View style={styles.personMeta}>
            {category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: category.color + '30' },
                ]}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[styles.categoryText, { color: category.color }]}>
                  {category.name}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.personName}>{person.name}</Text>
          <Text style={styles.personDesc}>{person.shortDescription}</Text>
          <Text style={styles.personTagline}>"{person.tagline}"</Text>
          <View style={styles.difficultyRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Text
                key={i}
                style={[
                  styles.difficultyDot,
                  { color: i < person.difficulty ? Colors.accent : Colors.border },
                ]}
              >
                ●
              </Text>
            ))}
            <Text style={styles.difficultyText}>난이도 {person.difficulty}/5</Text>
          </View>
          <Text style={styles.sourceNote}>출처: {person.sourceNote}</Text>
        </View>

        {/* 버전 토글 */}
        {alternateRoutines.length > 0 && (
          <View style={styles.versionToggle}>
            {(['original', 'realistic'] as const).map((v) => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.versionButton,
                  selectedVersion === v && styles.versionButtonActive,
                ]}
                onPress={() => setSelectedVersion(v)}
              >
                <Text
                  style={[
                    styles.versionButtonText,
                    selectedVersion === v && styles.versionButtonTextActive,
                  ]}
                >
                  {v === 'original' ? '원본 루틴' : '현실판 루틴'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 루틴 정보 */}
        {displayRoutine && (
          <>
            <View style={styles.routineInfo}>
              <Text style={styles.routineTitle}>{displayRoutine.title}</Text>
              <View style={styles.routineStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{displayRoutine.scheduleItems.length}</Text>
                  <Text style={styles.statLabel}>항목</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{displayRoutine.totalDuration}</Text>
                  <Text style={styles.statLabel}>분</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.floor(displayRoutine.totalDuration / 60)}h{' '}
                    {displayRoutine.totalDuration % 60}m
                  </Text>
                  <Text style={styles.statLabel}>총 시간</Text>
                </View>
              </View>
            </View>

            {/* 타임라인 */}
            <Text style={styles.timelineTitle}>하루 타임라인</Text>
            {displayRoutine.scheduleItems.map((item: ScheduleItem, index: number) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                  {index < displayRoutine.scheduleItems.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View
                  style={[
                    styles.timelineCard,
                    { borderLeftColor: getTypeColor(item.type) },
                  ]}
                >
                  <View style={styles.timelineCardHeader}>
                    <Text style={styles.timelineCardTitle}>{item.title}</Text>
                    <Text style={styles.timelineDuration}>{item.duration}분</Text>
                  </View>
                  <Text style={styles.timelineCardDesc}>{item.description}</Text>
                  {item.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredBadgeText}>필수</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* 액션 버튼 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveAsMyRoutine}
          >
            <Text style={styles.saveButtonText}>📋 내 루틴으로 저장</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push(`/execute/${displayRoutine?.id ?? routine.id}`)}
          >
            <Text style={styles.startButtonText}>▶ 지금 시작하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing['3xl'],
  },
  personCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  personMeta: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  categoryIcon: { fontSize: 12 },
  categoryText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  personName: {
    color: Colors.textPrimary,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  personDesc: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  personTagline: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: Spacing.sm,
  },
  difficultyDot: { fontSize: 10 },
  difficultyText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginLeft: Spacing.xs,
  },
  sourceNote: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontStyle: 'italic',
  },
  versionToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.base,
  },
  versionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  versionButtonActive: {
    backgroundColor: Colors.accent,
  },
  versionButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  versionButtonTextActive: {
    color: Colors.textOnAccent,
    fontWeight: '700',
  },
  routineInfo: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  routineTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  routineStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  timelineTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  timelineLeft: {
    width: 52,
    alignItems: 'center',
  },
  timelineTime: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.border,
    marginTop: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginLeft: Spacing.sm,
    borderLeftWidth: 3,
    marginBottom: Spacing.xs,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  timelineCardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  timelineDuration: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  timelineCardDesc: {
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
  requiredBadgeText: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  actionButtons: {
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  saveButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  startButtonText: {
    color: Colors.textOnAccent,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
