import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, UserRoutine, ScheduleItem } from '../types';
import { routines } from '../data/routines';

const STORAGE_KEY = 'user_routines';

interface RoutineState {
  builtinRoutines: Routine[];
  userRoutines: UserRoutine[];
  selectedRoutineId: string | null;
  isLoading: boolean;

  // Actions
  loadUserRoutines: () => Promise<void>;
  saveUserRoutine: (routine: UserRoutine) => Promise<void>;
  deleteUserRoutine: (id: string) => Promise<void>;
  selectRoutine: (id: string | null) => void;
  createUserRoutineFromBase: (
    baseRoutineId: string,
    name: string,
    modifiedItems?: ScheduleItem[]
  ) => UserRoutine;
  updateUserRoutineItems: (
    routineId: string,
    items: ScheduleItem[]
  ) => Promise<void>;
  getRoutineById: (id: string) => Routine | UserRoutine | undefined;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  builtinRoutines: routines,
  userRoutines: [],
  selectedRoutineId: null,
  isLoading: false,

  loadUserRoutines: async () => {
    set({ isLoading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: UserRoutine[] = JSON.parse(raw);
        set({ userRoutines: parsed });
      }
    } catch (e) {
      console.error('Failed to load user routines', e);
    } finally {
      set({ isLoading: false });
    }
  },

  saveUserRoutine: async (routine: UserRoutine) => {
    const { userRoutines } = get();
    const exists = userRoutines.findIndex((r) => r.id === routine.id);
    const updated =
      exists >= 0
        ? userRoutines.map((r) => (r.id === routine.id ? routine : r))
        : [...userRoutines, routine];

    set({ userRoutines: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  deleteUserRoutine: async (id: string) => {
    const { userRoutines } = get();
    const updated = userRoutines.filter((r) => r.id !== id);
    set({ userRoutines: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  selectRoutine: (id) => set({ selectedRoutineId: id }),

  createUserRoutineFromBase: (baseRoutineId, name, modifiedItems) => {
    const baseRoutine = routines.find((r) => r.id === baseRoutineId);
    const newRoutine: UserRoutine = {
      id: `user-${Date.now()}`,
      baseRoutineId,
      name,
      modifiedItems: modifiedItems ?? (baseRoutine?.scheduleItems ?? []),
      createdAt: new Date().toISOString(),
    };
    return newRoutine;
  },

  updateUserRoutineItems: async (routineId, items) => {
    const { userRoutines, saveUserRoutine } = get();
    const routine = userRoutines.find((r) => r.id === routineId);
    if (!routine) return;
    const updated: UserRoutine = { ...routine, modifiedItems: items };
    await saveUserRoutine(updated);
  },

  getRoutineById: (id) => {
    const { builtinRoutines, userRoutines } = get();
    return (
      builtinRoutines.find((r) => r.id === id) ??
      userRoutines.find((r) => r.id === id)
    );
  },
}));
