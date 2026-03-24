import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyProgress } from '../types';

const STORAGE_KEY = 'daily_progress';

interface ProgressState {
  progressList: DailyProgress[];
  todayProgress: DailyProgress | null;
  isLoading: boolean;

  // Actions
  loadProgress: () => Promise<void>;
  saveProgress: (progress: DailyProgress) => Promise<void>;
  startTodayProgress: (routineId: string, totalItems: number) => DailyProgress;
  toggleItemComplete: (itemId: string) => void;
  updateReflection: (
    routineId: string,
    note: string,
    bestHabit: string,
    worstHabit: string
  ) => Promise<void>;
  getProgressByDate: (date: string) => DailyProgress | undefined;
  getProgressByRoutine: (routineId: string) => DailyProgress[];
  getCompletionRate: (routineId: string) => number;
  getTodayDate: () => string;
}

const formatDate = (d: Date): string =>
  d.toISOString().split('T')[0];

export const useProgressStore = create<ProgressState>((set, get) => ({
  progressList: [],
  todayProgress: null,
  isLoading: false,

  loadProgress: async () => {
    set({ isLoading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: DailyProgress[] = JSON.parse(raw);
        const today = formatDate(new Date());
        set({
          progressList: parsed,
          todayProgress: parsed.find((p) => p.date === today) ?? null,
        });
      }
    } catch (e) {
      console.error('Failed to load progress', e);
    } finally {
      set({ isLoading: false });
    }
  },

  saveProgress: async (progress) => {
    const { progressList } = get();
    const idx = progressList.findIndex(
      (p) => p.date === progress.date && p.routineId === progress.routineId
    );
    const updated =
      idx >= 0
        ? progressList.map((p, i) => (i === idx ? progress : p))
        : [...progressList, progress];

    const today = formatDate(new Date());
    set({
      progressList: updated,
      todayProgress:
        progress.date === today ? progress : get().todayProgress,
    });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  startTodayProgress: (routineId, totalItems) => {
    const today = formatDate(new Date());
    const existing = get().progressList.find(
      (p) => p.date === today && p.routineId === routineId
    );
    if (existing) {
      set({ todayProgress: existing });
      return existing;
    }

    const newProgress: DailyProgress = {
      date: today,
      routineId,
      completedItems: [],
      totalItems,
      reflectionNote: '',
      bestHabit: '',
      worstHabit: '',
    };
    set({ todayProgress: newProgress });
    get().saveProgress(newProgress);
    return newProgress;
  },

  toggleItemComplete: (itemId) => {
    const { todayProgress, saveProgress } = get();
    if (!todayProgress) return;

    const completed = todayProgress.completedItems.includes(itemId)
      ? todayProgress.completedItems.filter((id) => id !== itemId)
      : [...todayProgress.completedItems, itemId];

    const updated: DailyProgress = { ...todayProgress, completedItems: completed };
    set({ todayProgress: updated });
    saveProgress(updated);
  },

  updateReflection: async (routineId, note, bestHabit, worstHabit) => {
    const { progressList, saveProgress } = get();
    const today = formatDate(new Date());
    const progress = progressList.find(
      (p) => p.date === today && p.routineId === routineId
    );
    if (!progress) return;

    await saveProgress({
      ...progress,
      reflectionNote: note,
      bestHabit,
      worstHabit,
    });
  },

  getProgressByDate: (date) =>
    get().progressList.find((p) => p.date === date),

  getProgressByRoutine: (routineId) =>
    get().progressList.filter((p) => p.routineId === routineId),

  getCompletionRate: (routineId) => {
    const list = get().getProgressByRoutine(routineId);
    if (list.length === 0) return 0;
    const total = list.reduce(
      (acc, p) =>
        acc + (p.totalItems > 0 ? p.completedItems.length / p.totalItems : 0),
      0
    );
    return Math.round((total / list.length) * 100);
  },

  getTodayDate: () => formatDate(new Date()),
}));
