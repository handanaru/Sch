import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useProgressStore } from '../../store/useProgressStore';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

export default function RetrospectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { todayProgress, updateReflection } = useProgressStore();
  const progress = todayProgress?.routineId === id ? todayProgress : null;

  const [note, setNote] = useState(progress?.reflectionNote ?? '');
  const [bestHabit, setBestHabit] = useState(progress?.bestHabit ?? '');
  const [worstHabit, setWorstHabit] = useState(progress?.worstHabit ?? '');

  const completionPercent = progress
    ? Math.round(
        (progress.completedItems.length / progress.totalItems) * 100
      )
    : 0;

  const handleSave = async () => {
    if (!id) return;
    await updateReflection(id, note, bestHabit, worstHabit);
    Alert.alert('회고 저장 완료', '오늘도 수고하셨습니다! 💪', [
      { text: '홈으로', onPress: () => router.replace('/') },
    ]);
  };

  const getEmoji = (percent: number) => {
    if (percent >= 90) return '🏆';
    if (percent >= 70) return '👍';
    if (percent >= 50) return '🙂';
    if (percent >= 30) return '😐';
    return '💪';
  };

  return (
    <>
      <Stack.Screen options={{ title: '오늘의 회고' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 완료 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>{getEmoji(completionPercent)}</Text>
          <Text style={styles.summaryTitle}>오늘의 루틴 완료율</Text>
          <Text style={styles.summaryPercent}>{completionPercent}%</Text>
          {progress && (
            <Text style={styles.summaryDetail}>
              {progress.completedItems.length}개 / {progress.totalItems}개 완료
            </Text>
          )}
          <View style={styles.summaryTrack}>
            <View
              style={[
                styles.summaryFill,
                { width: `${completionPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* 회고 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 회고</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>✨ 가장 잘한 습관</Text>
            <TextInput
              style={styles.input}
              placeholder="오늘 가장 잘 실천한 습관은 무엇인가요?"
              placeholderTextColor={Colors.textMuted}
              value={bestHabit}
              onChangeText={setBestHabit}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🔧 개선할 점</Text>
            <TextInput
              style={styles.input}
              placeholder="내일 더 잘하고 싶은 습관은 무엇인가요?"
              placeholderTextColor={Colors.textMuted}
              value={worstHabit}
              onChangeText={setWorstHabit}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📝 오늘의 메모</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="오늘 루틴을 하면서 느낀 점이나 특별한 인사이트를 기록해보세요."
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={5}
            />
          </View>
        </View>

        {/* 명언 */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "작은 습관의 변화가 결국 당신의 정체성을 바꾼다."
          </Text>
          <Text style={styles.quoteAuthor}>— James Clear, 아주 작은 습관의 힘</Text>
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>회고 저장하기 →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.skipButtonText}>나중에 하기</Text>
        </TouchableOpacity>
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
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  summaryEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  summaryPercent: {
    color: Colors.textPrimary,
    fontSize: FontSizes['4xl'],
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  summaryDetail: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  summaryTrack: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.progressTrack,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  summaryFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.base,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    minHeight: 48,
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  quoteCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    marginBottom: Spacing.xl,
  },
  quoteText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  quoteAuthor: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  saveButtonText: {
    color: Colors.textOnAccent,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
});
