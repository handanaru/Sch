export const Colors = {
  // Primary palette
  primary: '#1A1A2E',
  primaryLight: '#16213E',
  accent: '#E94560',
  accentLight: '#FF6B8A',

  // Background
  background: '#0F0F1A',
  surface: '#1E1E30',
  surfaceLight: '#2A2A40',
  card: '#252538',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#606080',
  textOnAccent: '#FFFFFF',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Category colors
  categories: {
    art: '#FF6B6B',
    science: '#4ECDC4',
    business: '#45B7D1',
    philosophy: '#96CEB4',
    sport: '#FFEAA7',
    literature: '#DDA0DD',
    music: '#98D8C8',
    politics: '#F7DC6F',
  },

  // Difficulty colors
  difficulty: {
    1: '#4CAF50',
    2: '#8BC34A',
    3: '#FFC107',
    4: '#FF9800',
    5: '#F44336',
  },

  // Schedule item type colors
  scheduleTypes: {
    wake: '#FFD93D',
    exercise: '#6BCB77',
    meal: '#FF6B6B',
    work: '#4D96FF',
    study: '#845EC2',
    meditation: '#00C9A7',
    rest: '#C4FCEF',
    creative: '#FF9671',
    social: '#F9F871',
    sleep: '#1A1A2E',
    other: '#A0A0C0',
  },

  // Border
  border: '#2A2A40',
  borderLight: '#3A3A55',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Progress
  progressTrack: '#2A2A40',
  progressFill: '#E94560',

  // Tab bar
  tabBarBackground: '#1A1A2E',
  tabBarActive: '#E94560',
  tabBarInactive: '#606080',
} as const;

export type ColorKey = keyof typeof Colors;
