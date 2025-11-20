
'use client';

import { useTheme } from 'next-themes';
import type { Brand } from './sheets';
import { useMemo } from 'react';

/**
 * Creates a map from Activity name to its color based on the current theme.
 * @param brands - The list of all brand objects.
 * @param theme - The current theme ('light' or 'dark').
 * @returns A record mapping activity names to their hex color codes.
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
 * @param activities - A string containing comma-separated activities (e.g., "Design, Architecture").
 * @param colorMap - The map of activities to their colors.
 * @returns A CSS linear-gradient string or a single color.
 */
export const buildActivityGradient = (
  activities: string | undefined,
  colorMap: Record<string, string>
): string => {
  if (!activities) {
    return 'hsl(var(--border))'; // Default border color
  }

  const activityList = activities.split(',').map((a) => a.trim());
  const colors = activityList
    .map((activity) => colorMap[activity])
    .filter(Boolean); // Filter out undefined colors

  if (colors.length === 0) {
    return 'hsl(var(--border))';
  }
  if (colors.length === 1) {
    return colors[0];
  }

  return `linear-gradient(120deg, ${colors.join(', ')})`;
};


/**
 * A hook to get the activity color map and build gradients.
 */
export const useActivityColors = (brands: Brand[]) => {
  const { resolvedTheme } = useTheme();
  
  const activityColorMap = useMemo(() => {
    return createActivityColorMap(brands, resolvedTheme === 'dark' ? 'dark' : 'light');
  }, [brands, resolvedTheme]);

  const getGradientStyle = (activities: string | undefined) => {
    const gradient = buildActivityGradient(activities, activityColorMap);
    if (gradient.startsWith('linear-gradient')) {
      return {
        borderImage: gradient,
        borderImageSlice: 1,
        borderWidth: '2px',
        boxShadow: `0 0 16px -4px ${activityColorMap[activities?.split(',')[0] ?? ''] || 'transparent'}`
      };
    }
    return { 
        borderColor: gradient,
        borderWidth: '2px',
        boxShadow: `0 0 16px -4px ${gradient}`
    };
  }

  return { activityColorMap, getGradientStyle };
}
