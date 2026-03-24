import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/useUserStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useRoutineStore } from '../../store/useRoutineStore';
import { persons } from '../../data/persons';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

export default function HomeScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const todayProgress = useProgressStore((s) => s.todayProgress);
  const userRoutines = useRoutineStore((s) => s.userRoutines);

  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [profile]);

  const featuredPersons = persons.slice(0, 3);
  const completionPercent = todayProgress
    ? Math.round(
        (todayProgress.completedItems.length / todayProgress.totalItems) * 100
      )
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 인사말 */}
      <View style={styles.greetingCard}>
        <Text style={styles.greetingSubtitle}>안녕하세요,</Text>
        <Text style={styles.greetingTitle}>
          {profile?.nickname ?? '탐험가'} 님 👋
        </Text>
        <Text style={styles.greetingDesc}>오늘도 대가의 루틴을 따라가 볼까요?</Text>
      </View>

      {/* 오늘의 진행률 */}
      {todayProgress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 진행률</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>완료한 항목</Text>
              <Text style={styles.progressPercent}>{completionPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
            </View>
            <Text style={styles.progressDetail}>
              {todayProgress.completedItems.length} / {todayProgress.totalItems} 완료
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => router.push(`/execute/${todayProgress.routineId}`)}
            >
              <Text style={styles.continueButtonText}>이어서 실행 →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 내 루틴 */}
      {userRoutines.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 루틴</Text>
            <TouchableOpacity onPress={() => router.push('/my-routine')}>
              <Text style={styles.sectionMore}>전체 보기</Text>
            </TouchableOpacity>
          </View>
          {userRoutines.slice(0, 2).map((routine) => (
            <TouchableOpacity
              key={routine.id}
              style={styles.routineCard}
              onPress={() => router.push(`/execute/${routine.id}`)}
            >
              <Text style={styles.routineCardTitle}>{routine.name}</Text>
              <Text style={styles.routineCardSub}>
                {routine.modifiedItems.length}개 항목
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 추천 인물 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>추천 인물</Text>
          <TouchableOpacity onPress={() => router.push('/explore')}>
            <Text style={styles.sectionMore}>전체 보기</Text>
          </TouchableOpacity>
        </View>
        {featuredPersons.map((person) => (
          <TouchableOpacity
            key={person.id}
            style={styles.personCard}
            onPress={() => router.push(`/routine/${person.id}-original`)}
          >
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{person.name}</Text>
              <Text style={styles.personTagline}>{person.tagline}</Text>
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
                <Text style={styles.difficultyLabel}>난이도</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  greetingCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  greetingSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  greetingTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  greetingDesc: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sectionMore: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
  },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  progressPercent: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.progressTrack,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  progressDetail: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.md,
  },
  continueButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  continueButtonText: {
    color: Colors.textOnAccent,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
  routineCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineCardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  routineCardSub: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  personCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  personTagline: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  difficultyDot: {
    fontSize: 10,
  },
  difficultyLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginLeft: Spacing.xs,
  },
});
