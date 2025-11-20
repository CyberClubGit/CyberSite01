
'use client';

import { useTheme } from 'next-themes';
import type { Brand } from './sheets';
import { useMemo } from 'react';

// Helper to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Helper to determine if a color is light or dark
const isColorLight = (r: number, g: number, b: number): boolean => {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};


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
 * Builds a CSS style object from a list of activities.
 */
export const buildActivityStyle = (
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
    return { background: colors[0] };
  }

  // Use a linear gradient to create a "blurry noise" effect.
  return { background: `linear-gradient(45deg, ${colors.join(', ')})` };
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
    const styleProps = buildActivityStyle(activities, activityColorMap);
    
    const firstColor = activities?.split(',')[0].trim();
    const shadowColor = firstColor ? activityColorMap[firstColor] : 'transparent';

    return {
      ...styleProps,
      boxShadow: `0 0 16px -4px ${shadowColor || 'transparent'}`,
    };
  }

  const getActivityBadgeStyle = (activity: string) => {
    const color = activityColorMap[activity];
    if (!color) return {};
    
    const rgb = hexToRgb(color);
    if (!rgb) return {};
    
    const textColor = isColorLight(rgb.r, rgb.g, rgb.b) ? '#000' : '#fff';

    return {
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
      color: color,
      borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
    };
  };

  return { getCardStyle, getActivityBadgeStyle };
}
