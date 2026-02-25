import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';

// ── Constants ──────────────────────────────────────────────────────────────

const CORNER_CUT = 24; // px of slanted top-right corner

// ── Live clock in HUD ─────────────────────────────────────────────────────

function useHudClock() {
  const [time, setTime] = useState(() => fmtUtc(Date.now()));
  useEffect(() => {
    const id = setInterval(() => setTime(fmtUtc(Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function fmtUtc(ms: number) {
  const d = new Date(ms);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  const s = d.getUTCSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}Z`;
}

// ── Blink animation (SCANNING...) ─────────────────────────────────────────

function useBlinkAnim(duration = 700) {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 0.12, duration, useNativeDriver: true }),
        Animated.timing(a, { toValue: 1, duration, useNativeDriver: true }),
      ])
    ).start();
  }, [a, duration]);
  return a;
}

// ── Tile config ────────────────────────────────────────────────────────────

type TileConfig = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  stat: string;
  color: string;
  route: string;
};

const TILES: TileConfig[] = [
  {
    id: 'radar',
    icon: 'globe-outline',
    label: 'Festival\nRadar',
    sub: 'LIVE SITE INTELLIGENCE',
    stat: '50 SITES IDENTIFIED',
    color: '#00F2FF',
    route: '/(tabs)/festivals',
  },
  {
    id: 'squad',
    icon: 'people-outline',
    label: 'Squad\nComms',
    sub: 'SNEAKERNET SYNC',
    stat: 'QR HANDSHAKE READY',
    color: '#FF00FF',
    route: '/(tabs)/squad',
  },
  {
    id: 'emergency',
    icon: 'shield-checkmark-outline',
    label: 'Emergency\nID',
    sub: 'MEDICAL CARD',
    stat: 'TAP TO UPDATE',
    color: '#FF3E3E',
    route: '/emergency-card',
  },
  {
    id: 'intel',
    icon: 'document-text-outline',
    label: 'Intel\nScripts',
    sub: 'SURVIVAL GUIDES',
    stat: 'READING FESTIVAL',
    color: '#00FF9F',
    route: '/reading-festival',
  },
];

// ── Glass Tile with SVG slanted corner ─────────────────────────────────────
//
// Renders an SVG Polygon as the tile background so the top-right corner
// is diagonally cut. The gradient fill goes from colour-tinted (top-left)
// to near-transparent (bottom-right) for the glassmorphism look.

function GlassTile({ tile }: { tile: TileConfig }) {
  const router = useRouter();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  // Polygon: all four corners except top-right is slanted
  const points =
    w > 0
      ? `0,0 ${w - CORNER_CUT},0 ${w},${CORNER_CUT} ${w},${h} 0,${h}`
      : '';

  const gradId = `grad_${tile.id}`;
  const strokeId = `stroke_${tile.id}`;

  return (
    <TouchableOpacity
      onLayout={handleLayout}
      style={[
        styles.tile,
        {
          shadowColor: tile.color,
          shadowOpacity: 0.5,
          shadowRadius: 15,
          elevation: 10,
        },
      ]}
      onPress={() => router.push(tile.route as any)}
      activeOpacity={0.78}
    >
      {/* SVG glass background */}
      {w > 0 && (
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Subtle gradient: colour-tinted top-left → dark transparent */}
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={tile.color} stopOpacity="0.13" />
              <Stop offset="0.6" stopColor="#0D0D0D" stopOpacity="0.06" />
              <Stop offset="1" stopColor="#000000" stopOpacity="0.01" />
            </LinearGradient>
          </Defs>
          <Polygon
            points={points}
            fill={`url(#${gradId})`}
            stroke={tile.color}
            strokeWidth="0.75"
            strokeOpacity="0.45"
          />
        </Svg>
      )}

      {/* Notch indicator at top-right cut */}
      {w > 0 && (
        <View
          style={[
            styles.notchDot,
            {
              top: 4,
              right: CORNER_CUT / 2 - 3,
              backgroundColor: tile.color,
              shadowColor: tile.color,
            },
          ]}
        />
      )}

      {/* Tile content */}
      <View style={styles.tileContent}>
        {/* Icon */}
        <View style={[styles.iconWrap, { borderColor: tile.color + '30' }]}>
          <Ionicons name={tile.icon} size={26} color={tile.color} />
        </View>

        {/* Title — system sans-serif for modern readability */}
        <Text style={styles.tileTitle}>{tile.label}</Text>

        {/* Sub-label — SpaceMono for tactical data feel */}
        <Text style={[styles.tileSub, { color: tile.color + '80' }]}>{tile.sub}</Text>

        {/* Stat badge */}
        <View
          style={[
            styles.statBadge,
            {
              borderColor: tile.color + '50',
              backgroundColor: tile.color + '18',
            },
          ]}
        >
          <View style={[styles.statDot, { backgroundColor: tile.color }]} />
          <Text style={[styles.statText, { color: tile.color }]}>{tile.stat}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── System status row ──────────────────────────────────────────────────────

const STATUS: { color: string; key: string; value: string }[] = [
  { color: '#00FF9F', key: 'LOCAL DB', value: 'WATERMELONDB V11 · ACTIVE' },
  { color: '#00F2FF', key: 'GEOFENCE', value: 'ENGINE STANDBY' },
  { color: '#FF3E3E', key: 'NETWORK', value: 'OFFLINE MODE ACTIVE' },
];

// ── Screen ─────────────────────────────────────────────────────────────────

export default function CommandCenterScreen() {
  const scanOpacity = useBlinkAnim(700);
  const clock = useHudClock();

  return (
    <View style={styles.container}>

      {/* ── HUD bar ──────────────────────────────────────────────────────── */}
      <View style={styles.hudBar}>
        <Text style={styles.hudText}>RAIDER_01</Text>
        <View style={styles.hudDivider} />
        <Animated.Text style={[styles.hudText, styles.hudCyan, { opacity: scanOpacity }]}>
          SCANNING...
        </Animated.Text>
        <View style={styles.hudDivider} />
        <Text style={[styles.hudText, styles.hudGreen]}>V11_STABLE</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.hudText, { color: 'rgba(255,255,255,0.3)' }]}>{clock}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero title ───────────────────────────────────────────────────── */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroEyebrow}>RAVERS SURVIVAL OS</Text>
          {/* System sans-serif for the big title — breaks up the monospace */}
          <Text style={styles.heroTitle}>Command{'\n'}Center</Text>
          <View style={styles.heroDivider}>
            <View style={styles.heroDividerLine} />
            <Text style={styles.heroDividerText}>MISSION CONTROL</Text>
            <View style={styles.heroDividerLine} />
          </View>
        </View>

        {/* ── 2 × 2 Mission Grid ───────────────────────────────────────────── */}
        <View style={styles.grid}>
          {TILES.map((tile) => (
            <GlassTile key={tile.id} tile={tile} />
          ))}
        </View>

        {/* ── System status ────────────────────────────────────────────────── */}
        <View style={styles.statusBox}>
          <Text style={styles.statusHeader}>SYSTEM STATUS</Text>
          {STATUS.map((row) => (
            <View key={row.key} style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: row.color }]} />
              <Text style={[styles.statusKey, { color: row.color }]}>{row.key}</Text>
              <Text style={styles.statusVal}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <Text style={styles.footer}>
          DATA STAYS ON DEVICE · NO CLOUD · NO SPINNERS
        </Text>

      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },

  // ── HUD Bar ──────────────────────────────────────────────────────────────
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: 'rgba(0,242,255,0.03)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,242,255,0.2)',
  },
  hudText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.2,
  },
  hudCyan: { color: '#00F2FF' },
  hudGreen: { color: '#00FF9F' },
  hudDivider: {
    width: StyleSheet.hairlineWidth,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ── Content ──────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 52,
    gap: 24,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  heroBlock: {
    gap: 8,
  },
  heroEyebrow: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 3,
  },
  // System sans-serif: clean, modern, readable — deliberately NOT SpaceMono
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heroDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  heroDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroDividerText: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 2.5,
  },

  // ── Mission Grid ─────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '47.5%',
    minHeight: 190,
    // Background is handled by SVG — we only set shadow here
    shadowOffset: { width: 0, height: 4 },
    overflow: 'visible',
  },
  tileContent: {
    padding: 18,
    paddingTop: 16,
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  // System sans-serif for the tile title (modern, trustworthy feel)
  tileTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  tileSub: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 0.75,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    gap: 5,
    marginTop: 4,
  },
  statDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statText: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  notchDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── System Status ─────────────────────────────────────────────────────────
  statusBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    gap: 11,
  },
  statusHeader: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  statusKey: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    width: 72,
  },
  statusVal: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
    flex: 1,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(255,255,255,0.12)',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
