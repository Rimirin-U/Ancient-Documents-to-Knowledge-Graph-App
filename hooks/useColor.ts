import { Colors } from '@/theme/colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ThemeName = keyof typeof Colors;
type ThemeColorKey = keyof typeof Colors.light & keyof typeof Colors.dark;

export function useColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorKey
) {
  const theme = (useColorScheme() ?? 'light') as ThemeName;
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}

// Backward-compatible export for existing call sites.
export const useThemeColor = useColor;