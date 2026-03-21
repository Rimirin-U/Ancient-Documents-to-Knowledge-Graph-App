/** 浅色：清爽纸感背景 + 青绿主色，适合长时间阅读与操作 */
const lightColors = {
  background: '#F8FAFC',
  foreground: '#0F172A',

  card: '#FFFFFF',
  cardForeground: '#0F172A',

  popover: '#FFFFFF',
  popoverForeground: '#0F172A',

  /** 主按钮、强调、选中 Tab */
  primary: '#0D9488',
  primaryForeground: '#FFFFFF',

  secondary: '#E0F2F1',
  secondaryForeground: '#115E59',

  muted: 'rgba(100, 116, 139, 0.12)',
  mutedForeground: '#64748B',

  accent: '#F0FDFA',
  accentForeground: '#134E4A',

  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',

  border: '#E2E8F0',
  input: '#E2E8F0',
  ring: '#0D9488',

  text: '#0F172A',
  textMuted: '#64748B',

  tint: '#0D9488',
  icon: '#64748B',
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#0D9488',

  blue: '#0D9488',
  green: '#059669',
  red: '#DC2626',
  orange: '#EA580C',
  yellow: '#CA8A04',
  pink: '#DB2777',
  purple: '#7C3AED',
  teal: '#14B8A6',
  indigo: '#4F46E5',

  /** 列表页等二级画布，略深于 background 以衬托白卡片 */
  screen: '#EDF2F7',
};

/** 深色：低对比护眼的 slate 底 + 亮青绿强调 */
const darkColors = {
  background: '#0B1220',
  foreground: '#F1F5F9',

  card: '#1E293B',
  cardForeground: '#F1F5F9',

  popover: '#1E293B',
  popoverForeground: '#F1F5F9',

  primary: '#2DD4BF',
  primaryForeground: '#042F2E',

  secondary: '#134E4A',
  secondaryForeground: '#CCFBF1',

  muted: 'rgba(148, 163, 184, 0.15)',
  mutedForeground: '#94A3B8',

  accent: '#134E4A',
  accentForeground: '#CCFBF1',

  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',

  border: '#334155',
  input: 'rgba(255, 255, 255, 0.12)',
  ring: '#2DD4BF',

  text: '#F1F5F9',
  textMuted: '#94A3B8',

  tint: '#2DD4BF',
  icon: '#94A3B8',
  tabIconDefault: '#64748B',
  tabIconSelected: '#2DD4BF',

  blue: '#2DD4BF',
  green: '#34D399',
  red: '#F87171',
  orange: '#FB923C',
  yellow: '#FACC15',
  pink: '#F472B6',
  purple: '#C084FC',
  teal: '#5EEAD4',
  indigo: '#A5B4FC',

  screen: '#0F172A',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export { darkColors, lightColors };

export type ColorKeys = keyof typeof lightColors;
