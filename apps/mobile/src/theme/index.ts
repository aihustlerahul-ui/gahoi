/**
 * Gahoi Sarthi design tokens — single source of truth for the mobile UI.
 * Mirrors docs/GahoiSarthi_DesignSpec_v1.docx §1 (Design System).
 *
 * The app identity is LIGHT: ivory background + sacred gold. Dark theme is
 * explicitly out of scope per spec §13.3 — do not reintroduce dark surfaces.
 */
import { Platform, TextStyle } from 'react-native';

/** §1.1 Colour palette — use these names, never raw hex in screens. */
export const colors = {
  // Primary brand
  sacredGold: '#B5620E', // primary CTA, active nav/pills, send-interest
  deepGold: '#7B5E2A', // section headings, drawer labels, body on light
  lightGold: '#FDF3E0', // pill backgrounds, top-pick bg, hover
  ivory: '#FDFAF5', // primary app background — all screens
  darkBrown: '#3D2E1A', // drawer header bg, profile name, primary headings
  midBrown: '#8A7A60', // secondary text, inactive icons, labels, helper
  borderWarm: '#E8E0D0', // card borders, dividers, input borders
  goldAccent: '#E8B84B', // stat numbers, kundli score badge, premium indicator

  // Surfaces
  white: '#FFFFFF', // cards, drawer, bottom nav
  pillInactiveBg: '#F5F0E8', // inactive category pill
  topPickBg: '#FDF9F0', // today's top pick card
  destructiveBg: '#FEF0F0', // log out / delete button bg
  destructiveBorder: '#F0A0A0',

  // Semantic
  verified: '#1A7A45', // verified badge, accepted banner, active, success
  pending: '#E8B84B', // pending review, expiry warning
  rejected: '#C0392B', // delete/logout text, rejected, errors
  manglik: '#7B2D8B', // manglik pill bg only
  accepted: '#1565A0', // accepted-interest banner accent

  // Text shortcuts
  textPrimary: '#3D2E1A',
  textSecondary: '#8A7A60',
  onGold: '#FFFFFF', // text on sacred-gold CTA
} as const;

/** §1.3 Spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

/** §1.3 Corner radius. */
export const radius = {
  card: 12,
  pill: 20,
  button: 10,
  avatar: 9999,
} as const;

/**
 * §1.2 Typography. Spec font is Arial / Noto Sans Devanagari (sans-serif).
 * We use the platform system sans-serif (handles Latin + Devanagari via
 * fallback); bundling Noto Sans Devanagari is a tracked follow-up.
 * NOTE: no serif/Georgia anywhere — spec mandates clean sans-serif.
 */
const sans = Platform.select({ ios: 'System', android: 'sans-serif', default: undefined });

export const typography = {
  fontFamily: sans,
  appTitle: { fontFamily: sans, fontSize: 16, fontWeight: '500', color: colors.darkBrown } as TextStyle,
  sectionHeading: { fontFamily: sans, fontSize: 13, fontWeight: '500', color: colors.sacredGold } as TextStyle,
  cardName: { fontFamily: sans, fontSize: 13, fontWeight: '500', color: colors.darkBrown } as TextStyle,
  body: { fontFamily: sans, fontSize: 12, fontWeight: '400', color: colors.textPrimary } as TextStyle,
  secondary: { fontFamily: sans, fontSize: 11, fontWeight: '400', color: colors.midBrown } as TextStyle,
  badge: { fontFamily: sans, fontSize: 10, fontWeight: '500' } as TextStyle,
} as const;

export const theme = { colors, spacing, radius, typography } as const;
export type Theme = typeof theme;
