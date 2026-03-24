export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Person {
  id: string;
  name: string;
  category: string; // Category.id
  shortDescription: string;
  tagline: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  sourceNote: string;
  imageUrl: string;
}

export type ScheduleItemType =
  | 'wake'
  | 'exercise'
  | 'meal'
  | 'work'
  | 'study'
  | 'meditation'
  | 'rest'
  | 'creative'
  | 'social'
  | 'sleep'
  | 'other';

export interface ScheduleItem {
  id: string;
  time: string; // "HH:MM" format
  title: string;
  description: string;
  duration: number; // minutes
  type: ScheduleItemType;
  required: boolean;
}

export type RoutineVersionType = 'original' | 'realistic';

export interface Routine {
  id: string;
  personId: string;
  title: string;
  totalDuration: number; // minutes
  versionType: RoutineVersionType;
  scheduleItems: ScheduleItem[];
}

export interface UserRoutine {
  id: string;
  baseRoutineId: string;
  name: string;
  modifiedItems: ScheduleItem[];
  createdAt: string; // ISO 8601
}

export interface DailyProgress {
  date: string; // "YYYY-MM-DD"
  routineId: string;
  completedItems: string[]; // ScheduleItem.id[]
  totalItems: number;
  reflectionNote: string;
  bestHabit: string;
  worstHabit: string;
}

export interface NotificationSetting {
  enabled: boolean;
  time: string; // "HH:MM"
  routineId?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  onboardingCompleted: boolean;
  createdAt: string;
  notificationSetting: NotificationSetting;
}
