import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRoutineStore } from '../../store/useRoutineStore';
import { routines } from '../../data/routines';
import { persons } from '../../data/persons';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

export default function MyRoutineScreen() {
  const router = useRouter();
  const { userRoutines, deleteUserRoutine } = useRoutineStore();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '루틴 삭제',
      `"${name}"을(를) 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteUserRoutine(id),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 루틴</Text>
        <Text style={styles.headerDesc}>
          대가의 루틴을 나만의 방식으로 변형해보세요
        </Text>
      </View>

      {/* 내 루틴 목록 */}
      {userRoutines.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>아직 내 루틴이 없어요</Text>
          <Text style={styles.emptyDesc}>
            탐색 탭에서 마음에 드는 루틴을{'\n'}내 것으로 만들어 보세요!
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.exploreButtonText}>루틴 탐색하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>
            내가 만든 루틴 ({userRoutines.length}개)
          </Text>
          {userRoutines.map((userRoutine) => {
            const base = routines.find((r) => r.id === userRoutine.baseRoutineId);
            const person = base
              ? persons.find((p) => p.id === base.personId)
              : null;

            return (
              <View key={userRoutine.id} style={styles.routineCard}>
                <TouchableOpacity
                  style={styles.routineCardBody}
                  onPress={() => router.push(`/execute/${userRoutine.id}`)}
                >
                  <Text style={styles.routineCardTitle}>{userRoutine.name}</Text>
                  {person && (
                    <Text style={styles.routineCardBase}>
                      기반: {person.name}의 루틴
                    </Text>
                  )}
                  <Text style={styles.routineCardItems}>
                    {userRoutine.modifiedItems.length}개 항목 ·{' '}
                    {userRoutine.modifiedItems.reduce(
                      (acc, item) => acc + item.duration,
                      0
                    )}분
                  </Text>
                  <Text style={styles.routineCardDate}>
                    생성일:{' '}
                    {new Date(userRoutine.createdAt).toLocaleDateString('ko-KR')}
                  </Text>
                </TouchableOpacity>
                <View style={styles.routineCardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/execute/${userRoutine.id}`)}
                  >
                    <Text style={styles.actionButtonText}>▶ 실행</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() =>
                      handleDelete(userRoutine.id, userRoutine.name)
                    }
                  >
                    <Text style={styles.deleteButtonText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* 대가의 루틴에서 시작하기 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>대가의 루틴에서 시작하기</Text>
        {routines
          .filter((r) => r.versionType === 'realistic')
          .slice(0, 3)
          .map((routine) => {
            const person = persons.find((p) => p.id === routine.personId);
            return (
              <TouchableOpacity
                key={routine.id}
                style={styles.baseRoutineCard}
                onPress={() => router.push(`/routine/${routine.id}`)}
              >
                <Text style={styles.baseRoutineTitle}>
                  {person?.name} 현실판 루틴
                </Text>
                <Text style={styles.baseRoutineDesc}>
                  {routine.scheduleItems.length}개 항목 · {routine.totalDuration}분
                </Text>
              </TouchableOpacity>
            );
          })}
      </View>
    </ScrollView>
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
  header: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  headerDesc: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  exploreButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  exploreButtonText: {
    color: Colors.textOnAccent,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  routineCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  routineCardBody: {
    padding: Spacing.base,
  },
  routineCardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  routineCardBase: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  routineCardItems: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  routineCardDate: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  routineCardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  actionButtonText: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: Spacing.base,
    borderRightWidth: 0,
  },
  deleteButtonText: {
    fontSize: FontSizes.base,
  },
  baseRoutineCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  baseRoutineTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  baseRoutineDesc: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
});
