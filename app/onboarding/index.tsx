import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/useUserStore';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

const STEPS = [
  {
    id: 'welcome',
    title: '대가의 습관에\n오신 것을 환영해요',
    subtitle: '위대한 사람들의 하루 루틴을 따라하고\n나만의 습관을 만들어보세요.',
    emoji: '🏆',
  },
  {
    id: 'concept',
    title: '어떻게 사용하나요?',
    subtitle: '다윈, 잡스, 아우렐리우스...\n대가들의 루틴을 탐색하고\n내 현실에 맞게 변형해보세요.',
    emoji: '🔍',
  },
  {
    id: 'track',
    title: '매일 실천하고\n기록하세요',
    subtitle: '체크리스트로 실천하고\n회고를 통해 더 나은 습관을 만들어가세요.',
    emoji: '📝',
  },
  {
    id: 'nickname',
    title: '마지막으로,\n이름을 알려주세요',
    subtitle: '앱에서 사용할 닉네임을 입력해주세요.',
    emoji: '👤',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { createDefaultProfile, completeOnboarding } = useUserStore();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const isNicknameStep = currentStep.id === 'nickname';

  const handleNext = async () => {
    if (isLastStep) {
      if (!nickname.trim()) return;
      createDefaultProfile(nickname.trim());
      await completeOnboarding();
      router.replace('/');
    } else {
      setStep((s) => s + 1);
    }
  };

  const canProceed = isNicknameStep ? nickname.trim().length > 0 : true;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 진행 인디케이터 */}
        <View style={styles.indicators}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.indicator,
                i <= step && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        {/* 메인 콘텐츠 */}
        <View style={styles.main}>
          <Text style={styles.emoji}>{currentStep.emoji}</Text>
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

          {/* 닉네임 입력 */}
          {isNicknameStep && (
            <TextInput
              style={styles.nicknameInput}
              placeholder="닉네임 입력 (예: 갓생러)"
              placeholderTextColor={Colors.textMuted}
              value={nickname}
              onChangeText={setNickname}
              maxLength={12}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleNext}
            />
          )}
        </View>

        {/* 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? '시작하기 🚀' : '다음 →'}
            </Text>
          </TouchableOpacity>

          {step > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep((s) => s - 1)}
            >
              <Text style={styles.backButtonText}>← 이전</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
  },
  indicators: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  indicator: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
  },
  indicatorActive: {
    backgroundColor: Colors.accent,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing['3xl'],
  },
  emoji: {
    fontSize: 72,
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: Spacing.base,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.xl,
  },
  nicknameInput: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: Spacing.base,
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  footer: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  nextButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    color: Colors.textOnAccent,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  backButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
});
