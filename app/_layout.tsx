import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../store/useUserStore';
import { useRoutineStore } from '../store/useRoutineStore';
import { useProgressStore } from '../store/useProgressStore';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const loadProfile = useUserStore((s) => s.loadProfile);
  const loadUserRoutines = useRoutineStore((s) => s.loadUserRoutines);
  const loadProgress = useProgressStore((s) => s.loadProgress);

  useEffect(() => {
    loadProfile();
    loadUserRoutines();
    loadProgress();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="routine/[id]"
          options={{ title: '루틴 상세', headerBackTitle: '' }}
        />
        <Stack.Screen
          name="execute/[id]"
          options={{ title: '루틴 실행', headerBackTitle: '' }}
        />
        <Stack.Screen
          name="retrospect/[id]"
          options={{ title: '오늘의 회고', headerBackTitle: '' }}
        />
        <Stack.Screen
          name="onboarding/index"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}
