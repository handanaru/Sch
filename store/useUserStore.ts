import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, NotificationSetting } from '../types';

const STORAGE_KEY = 'user_profile';

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;

  // Actions
  loadProfile: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateNotificationSetting: (setting: NotificationSetting) => Promise<void>;
  createDefaultProfile: (nickname: string) => UserProfile;
}

const createDefault = (nickname: string): UserProfile => ({
  id: `user-${Date.now()}`,
  nickname,
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
  notificationSetting: {
    enabled: false,
    time: '08:00',
  },
});

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: false,

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ profile: JSON.parse(raw) });
      }
    } catch (e) {
      console.error('Failed to load user profile', e);
    } finally {
      set({ isLoading: false });
    }
  },

  saveProfile: async (profile) => {
    set({ profile });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  updateNickname: async (nickname) => {
    const { profile, saveProfile } = get();
    if (!profile) return;
    await saveProfile({ ...profile, nickname });
  },

  completeOnboarding: async () => {
    const { profile, saveProfile } = get();
    if (!profile) return;
    await saveProfile({ ...profile, onboardingCompleted: true });
  },

  updateNotificationSetting: async (setting) => {
    const { profile, saveProfile } = get();
    if (!profile) return;
    await saveProfile({ ...profile, notificationSetting: setting });
  },

  createDefaultProfile: (nickname) => {
    const profile = createDefault(nickname);
    set({ profile });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile)).catch(
      console.error
    );
    return profile;
  },
}));
