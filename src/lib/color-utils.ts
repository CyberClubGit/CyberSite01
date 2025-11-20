
'use client';

import { useTheme } from 'next-themes';
import type { Brand } from './sheets';
import { useMemo } from 'react';

/**
 * Creates a map from Activity name to its color based on the current theme.
 */
export const createActivityColorMap = (
  brands: Brand[],
  theme: 'light' | 'dark'
): Record<string, string> => {
  const colorMap: Record<string, string> = {};

  brands.forEach((brand) => {
    if (brand.Activity) {
      const color = theme === 'dark' ? brand['Color Dark'] : brand['Color Light'];
      if (color) {
        colorMap[brand.Activity] = color.startsWith('#') ? color : `#${color}`;
      }
    }
  });

  return colorMap;
};

/**
 * Builds a CSS linear-gradient string from a list of activities.
 */
export const buildActivityGradient = (
  activities: string | undefined,
  colorMap: Record<string, string>
): { background?: string; borderColor?: string } => {
  const defaultColor = 'hsl(var(--border))';

  if (!activities) {
    return { borderColor: defaultColor };
  }

  const activityList = activities.split(',').map((a) => a.trim());
  const colors = activityList
    .map((activity) => colorMap[activity])
    .filter(Boolean);

  if (colors.length === 0) {
    return { borderColor: defaultColor };
  }
  if (colors.length === 1) {
    return { borderColor: colors[0] };
  }

  return { background: `linear-gradient(120deg, ${colors.join(', ')})` };
};

/**
 * A hook to get the activity color map and generate style objects.
 */
export const useActivityColors = (brands: Brand[]) => {
  const { resolvedTheme } = useTheme();
  
  const activityColorMap = useMemo(() => {
    return createActivityColorMap(brands, resolvedTheme === 'dark' ? 'dark' : 'light');
  }, [brands, resolvedTheme]);

  const getCardStyle = (activities: string | undefined) => {
    const styleProps = buildActivityGradient(activities, activityColorMap);
    
    // Extrait la première couleur pour l'ombre
    const firstColor = activities?.split(',')[0].trim();
    const shadowColor = firstColor ? activityColorMap[firstColor] : 'transparent';

    return {
      ...styleProps,
      boxShadow: `0 0 16px -4px ${shadowColor || 'transparent'}`,
    };
  }

  return { getCardStyle };
}
