/**
 * ShotCoach AI — design tokens (see shot_coach_ai_design_system.md).
 * Light, premium: soft blue background, white surfaces, primary blue CTAs, teal accent.
 */

export const colors = {
  background: '#F7FAFF',
  surface: '#FFFFFF',
  surfaceMuted: '#E8EEF9',
  primary: '#2F6BFF',
  primaryLight: '#DDEAFF',
  secondary: '#6EA8FF',
  accent: '#37D6B0',
  accentDark: '#2A9B83',
  text: '#0B1B34',
  textMuted: '#6B7890',
  textTertiary: '#A7B0C0',
  border: '#DDE7F5',
  card: '#FFFFFF',
  white: '#FFFFFF',
  success: '#2FD39B',
  warning: '#FFB84D',
  danger: '#FF5B6E',
  /** Legacy name — line overlays / arrows; maps to secondary blue. */
  cyan: '#6EA8FF'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999
};

export const typography = {
  largeTitle: 34,
  title: 28,
  headline: 22,
  body: 16,
  caption: 13,
  button: 17
};

/** RN shadow presets (design: card / button / soft). */
export const shadows = {
  card: {
    shadowColor: '#2F6BFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8
  },
  button: {
    shadowColor: '#2F6BFF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10
  },
  soft: {
    shadowColor: '#0B1B34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4
  }
};
