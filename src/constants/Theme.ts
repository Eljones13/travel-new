export const COLORS = {
  // Backgrounds
  background: '#0D0D0D',
  surface: '#1A1A1A',

  // Neon Accents
  cyan: '#00F2FF',
  magenta: '#FF00FF',
  orange: '#FF3E3E',
  gold: '#FFD166',

  // Glass layers
  glassFill: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(0, 242, 255, 0.3)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMono: '#00F2FF',
} as const;

// Monospaced font family — cross-platform safe stack
const MONO_FONT = 'SpaceMono' as const;

export const TYPOGRAPHY = {
  // Logistics data: coordinates, timestamps, codes
  mono: {
    fontFamily: MONO_FONT,
    color: COLORS.textMono,
  },
  monoSm: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textMono,
  },
  monoMd: {
    fontFamily: MONO_FONT,
    fontSize: 14,
    letterSpacing: 1,
    color: COLORS.textMono,
  },
  monoLg: {
    fontFamily: MONO_FONT,
    fontSize: 20,
    letterSpacing: 2,
    fontWeight: '700' as const,
    color: COLORS.textMono,
  },
  // Label caps — section headers, field labels
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: COLORS.textSecondary,
  },
} as const;

/**
 * Returns the neon accent color for a given festival zone.
 * Matches on substrings so 'The Oasis', 'Oasis Stage', 'Aquatic Dome', etc. all resolve.
 * Falls back to COLORS.cyan for unknown zones.
 */
export function getZoneColor(zone: string): string {
  const z = zone.toLowerCase();
  if (z.includes('oasis') || z.includes('chill')) return COLORS.gold;
  if (z.includes('aquatic') || z.includes('tech'))  return COLORS.cyan;
  if (z.includes('main') || z.includes('mainstage')) return COLORS.magenta;
  return COLORS.cyan;
}

/**
 * Drop shadow / glow style for map markers and schedule tags.
 * Apply as a style prop alongside a neon borderColor.
 */
export const TACTICAL_GLOW = {
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.85,
  shadowRadius: 8,
  elevation: 8,          // Android — no color control, but lifts the marker
} as const;

export const CYAN_GLOW = {
  shadowColor: '#00F2FF',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 10,
  elevation: 8,
} as const;

export const GLASS_STYLE = {
  backgroundColor: COLORS.glassFill,
  borderWidth: 0.5,
  borderColor: COLORS.glassBorder,
  borderRadius: 12,
  // iOS frosted glass
  backdropFilter: 'blur(12px)',
  // Android equivalent (use with @react-native-community/blur or Expo BlurView)
  overflow: 'hidden',
} as const;
