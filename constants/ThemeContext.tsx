// constants/ThemeContext.tsx
//
// Global app context — theme + units
//
//   const { colors, isDark, themeMode, setThemeMode, distUnit, setDistUnit } = useTheme();
//
// distUnit: 'km' | 'mi'
//   — controls all distance + pace display across the app
//   — pace is automatically min/km or min/mi (never set independently)

import React, {
  createContext, useContext, useState, useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { getColors, type ColorPalette } from './theme';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';
export type DistUnit  = 'km' | 'mi';

interface ThemeContextValue {
  colors:       ColorPalette;
  isDark:       boolean;
  themeMode:    ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  distUnit:     DistUnit;
  setDistUnit:  (unit: DistUnit) => void;
}

// ─────────────────────────────────────────────────────────────
// UNIT CONVERSION HELPERS  (exported for use anywhere)
// ─────────────────────────────────────────────────────────────

const KM_TO_MI = 0.621371;
const MI_TO_KM = 1.60934;

/** Format a stored-km value for display in the current unit */
export function fmtDist(km: number, unit: DistUnit, decimals = 1): string {
  if (unit === 'mi') return (km * KM_TO_MI).toFixed(decimals);
  return km.toFixed(decimals);
}

/** Unit label string: "km" or "mi" */
export function distLabel(unit: DistUnit): string {
  return unit === 'mi' ? 'mi' : 'km';
}

/** Convert a stored min/km pace string to min/mi if needed.
 *  Input: "5:30" or "5:30/km" → Output: "8:51" (if miles) or "5:30" (if km)
 */
export function fmtPace(pacePerKm: string, unit: DistUnit): string {
  const clean = pacePerKm.replace('/km', '').replace('/mi', '').trim();
  const [minStr, secStr] = clean.split(':');
  const totalSec = parseInt(minStr, 10) * 60 + parseInt(secStr || '0', 10);
  if (unit === 'mi') {
    const pacePerMiSec = Math.round(totalSec * MI_TO_KM);
    const m = Math.floor(pacePerMiSec / 60);
    const s = pacePerMiSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  return clean;
}

/** Pace suffix label: "/km" or "/mi" */
export function paceLabel(unit: DistUnit): string {
  return unit === 'mi' ? '/mi' : '/km';
}

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  colors:       getColors(false),
  isDark:       false,
  themeMode:    'system',
  setThemeMode: () => {},
  distUnit:     'km',
  setDistUnit:  () => {},
});

// ─────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [distUnit, setDistUnit]   = useState<DistUnit>('km');

  const isDark = useMemo(() => {
    if (themeMode === 'dark')  return true;
    if (themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => getColors(isDark), [isDark]);

  const value = useMemo(
    () => ({ colors, isDark, themeMode, setThemeMode, distUnit, setDistUnit }),
    [colors, isDark, themeMode, distUnit]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}