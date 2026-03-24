import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

interface ReflectionFormProps {
  bestHabit: string;
  worstHabit: string;
  note: string;
  onBestHabitChange: (v: string) => void;
  onWorstHabitChange: (v: string) => void;
  onNoteChange: (v: string) => void;
}

export function ReflectionForm({
  bestHabit,
  worstHabit,
  note,
  onBestHabitChange,
  onWorstHabitChange,
  onNoteChange,
}: ReflectionFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>✨ 가장 잘한 습관</Text>
        <TextInput
          style={styles.input}
          placeholder="오늘 가장 잘 실천한 습관은 무엇인가요?"
          placeholderTextColor={Colors.textMuted}
          value={bestHabit}
          onChangeText={onBestHabitChange}
          multiline
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>🔧 개선할 점</Text>
        <TextInput
          style={styles.input}
          placeholder="내일 더 잘하고 싶은 습관은?"
          placeholderTextColor={Colors.textMuted}
          value={worstHabit}
          onChangeText={onWorstHabitChange}
          multiline
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>📝 오늘의 메모</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="오늘 루틴을 하면서 느낀 점이나 인사이트를 기록해보세요."
          placeholderTextColor={Colors.textMuted}
          value={note}
          onChangeText={onNoteChange}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.base,
  },
  field: {},
  label: {
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
  },
});
