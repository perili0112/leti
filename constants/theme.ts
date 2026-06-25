// ─────────────────────────────────────────────────────────────
// constants/theme.ts
// Single source of truth for all design decisions.
// Every value here maps directly to the Leti mockup spec.
// ─────────────────────────────────────────────────────────────

// ── Light Colors (default) ────────────────────────────────────
export const Colors = {
  // Backgrounds
  bg: '#EDE9E0',        // warm off-white — app background
  card: '#F5F2EB',      // card surfaces
  cardAlt: '#EEEAE4',   // slightly warmer card (last run card in mockup)

  // Dark surfaces (run tracker, after-run header, nav)
  dark: '#0A1A1B',
  darkSurface1: '#112224',
  darkSurface2: '#152B2D',

  // Brand teal
  primary: '#1B6C70',         // light mode interactive
  primaryDark: '#3EBEC4',     // dark mode interactive
  primaryFaint: '#EAF3F3',    // teal tint backgrounds

  // Warm amber accent — earned moments only
  accent: '#E8991C',
  accentFaint: '#FEF4E2',

  // Text
  textPrimary: '#0A1A1B',
  textSecondary: '#4C6B6C',
  textMuted: '#91AFAF',
  textTertiary: '#C0BCBA',

  // Borders
  border: 'rgba(10,26,27,0.07)',
  borderMedium: 'rgba(10,26,27,0.12)',
  borderStrong: 'rgba(10,26,27,0.22)',

  // Semantic
  success: '#3BBF6E',
  danger: '#D4470A',
  dangerFaint: '#FFECE8',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ── Typography ────────────────────────────────────────────────
// D = Barlow Semi Condensed (display / big numbers / headlines)
// U = Figtree (UI / body / labels)
export const FontFamily = {
  displayLight: 'BarlowSemiCondensed_300Light',
  displayRegular: 'BarlowSemiCondensed_400Regular',
  displayMedium: 'BarlowSemiCondensed_500Medium',
  displaySemiBold: 'BarlowSemiCondensed_600SemiBold',
  displayBold: 'BarlowSemiCondensed_700Bold',
  displayExtraBold: 'BarlowSemiCondensed_800ExtraBold',
  uiRegular: 'Figtree_400Regular',
  uiMedium: 'Figtree_500Medium',
  uiSemiBold: 'Figtree_600SemiBold',
  uiBold: 'Figtree_700Bold',
} as const;

// ── Spacing ───────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ── Border Radius ─────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,   // matches plan card in mockup
  xxl: 22,
  full: 999,
} as const;

// ── Shadows ───────────────────────────────────────────────────
export const Shadow = {
  card: {
    shadowColor: '#0A1A1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardSubtle: {
    shadowColor: '#0A1A1B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  button: {
    shadowColor: '#0A1A1B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 6,
  },
} as const;

// ── Dark Colors ───────────────────────────────────────────────
//
// Background decision: #111C1D
// — Not pure black (#000000): avoids harsh OLED contrast + eye strain
// — Not neutral gray (#121212): carries Leti's teal brand hue
// — Research basis: Material Design recommends dark grey over black;
//   teal-tinted keeps brand identity consistent across both modes.
//   Cards at #1A2B2C, elevated at #1F3335 — visible hierarchy without
//   the flat feel of same-value dark surfaces.
//
export const DarkColors = {
  // Backgrounds — pure grey, no teal tint
  bg: '#121212',
  card: '#1C1C1C',
  cardAlt: '#242424',

  // Dark surfaces — run tracker, nav bars, modals
  dark: '#0A0A0A',
  darkSurface1: '#111111',
  darkSurface2: '#161616',

  // Brand teal — stays vibrant against grey backgrounds
  primary: '#3EBEC4',
  primaryDark: '#3EBEC4',
  primaryFaint: 'rgba(62,190,196,0.10)',

  // Warm amber accent
  accent: '#F0A832',
  accentFaint: 'rgba(240,168,50,0.13)',

  // Text — neutral off-white, no teal tint
  textPrimary: '#E2E2E2',
  textSecondary: '#888888',
  textMuted: '#555555',
  textTertiary: '#333333',

  // Borders — white at low opacity
  border: 'rgba(255,255,255,0.08)',
  borderMedium: 'rgba(255,255,255,0.13)',
  borderStrong: 'rgba(255,255,255,0.22)',

  // Semantic
  success: '#3BBF6E',
  danger: '#FF5A3C',
  dangerFaint: 'rgba(255,90,60,0.12)',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ── Color factory — use this everywhere instead of Colors directly ──
export type ColorPalette = typeof Colors;

export function getColors(isDark: boolean): ColorPalette {
  return isDark ? (DarkColors as unknown as ColorPalette) : Colors;
}