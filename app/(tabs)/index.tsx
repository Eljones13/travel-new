import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

// ── HUD blink: SCANNING... pulses at 600ms ─────────────────────────────────

function useBlinkAnim() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return opacity;
}

// ── Mission Tile config ────────────────────────────────────────────────────

type TileConfig = {
  id: string;
  label: string;
  sub: string;
  stat: string;
  color: string;
  icon: string;
  route: string;
};

const TILES: TileConfig[] = [
  {
    id: 'radar',
    label: 'FESTIVAL\nRADAR',
    sub: 'LIVE SITE INTELLIGENCE',
    stat: '50 SITES IDENTIFIED',
    color: '#00F2FF',
    icon: '📡',
    route: '/(tabs)/festivals',
  },
  {
    id: 'squad',
    label: 'SQUAD\nCOMMS',
    sub: 'SNEAKERNET SYNC',
    stat: 'QR HANDSHAKE READY',
    color: '#FF00FF',
    icon: '📶',
    route: '/(tabs)/squad',
  },
  {
    id: 'emergency',
    label: 'EMERGENCY\nID',
    sub: 'MEDICAL CARD',
    stat: 'TAP TO UPDATE',
    color: '#FF3E3E',
    icon: '🆘',
    route: '/emergency-card',
  },
  {
    id: 'intel',
    label: 'INTEL\nSCRIPTS',
    sub: 'SURVIVAL GUIDES',
    stat: 'READING FESTIVAL',
    color: '#00FF9F',
    icon: '📋',
    route: '/reading-festival',
  },
];

// ── Mission Tile ───────────────────────────────────────────────────────────

function MissionTile({ tile }: { tile: TileConfig }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.tile, { borderColor: tile.color, shadowColor: tile.color }]}
      onPress={() => router.push(tile.route as any)}
      activeOpacity={0.72}
    >
      <Text style={styles.tileIcon}>{tile.icon}</Text>
      <Text style={[styles.tileLabel, { color: tile.color }]}>{tile.label}</Text>
      <Text style={styles.tileSub}>{tile.sub}</Text>
      <View style={[styles.statBadge, { borderColor: tile.color + '66' }]}>
        <Text style={[styles.statText, { color: tile.color }]}>{tile.stat}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── System status rows ─────────────────────────────────────────────────────

const STATUS_ROWS = [
  { color: '#00FF9F', label: 'LOCAL DB · WATERMELONDB V11' },
  { color: '#00F2FF', label: 'GEOFENCE ENGINE · STANDBY' },
  { color: '#FF3E3E', label: 'NETWORK · OFFLINE MODE ACTIVE' },
];

// ── Screen ─────────────────────────────────────────────────────────────────

export default function CommandCenterScreen() {
  const scanOpacity = useBlinkAnim();

  return (
    <View style={styles.container}>

      {/* ── Persistent HUD Bar ───────────────────────────────────────────── */}
      <View style={styles.hudBar}>
        <Text style={styles.hudChunk}>USER: RAIDER_01</Text>
        <Text style={styles.hudPipe}>|</Text>
        <Animated.Text style={[styles.hudChunk, styles.hudCyan, { opacity: scanOpacity }]}>
          SIGNAL: SCANNING...
        </Animated.Text>
        <Text style={styles.hudPipe}>|</Text>
        <Text style={[styles.hudChunk, styles.hudGreen]}>DB: V11_STABLE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Title ────────────────────────────────────────────────────────── */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleEyebrow}>// RAVERS SURVIVAL OS</Text>
          <Text style={styles.titleMain}>COMMAND CENTER</Text>
          <Text style={styles.titleSub}>MISSION CONTROL · OFFLINE ACTIVE</Text>
        </View>

        {/* ── 2 × 2 Mission Grid ───────────────────────────────────────────── */}
        <View style={styles.grid}>
          {TILES.map((tile) => (
            <MissionTile key={tile.id} tile={tile} />
          ))}
        </View>

        {/* ── System Status ────────────────────────────────────────────────── */}
        <View style={styles.statusBox}>
          <Text style={styles.statusHeader}>SYSTEM STATUS</Text>
          {STATUS_ROWS.map((row) => (
            <View key={row.label} style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: row.color }]} />
              <Text style={styles.statusText}>{row.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <Text style={styles.footer}>
          ALL SYSTEMS GO · DATA STAYS ON DEVICE · NO CLOUD DEPENDENCY
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

  // HUD Bar
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(0, 242, 255, 0.04)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 242, 255, 0.25)',
    shadowColor: '#00F2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  hudChunk: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.2,
  },
  hudCyan: { color: '#00F2FF' },
  hudGreen: { color: '#00FF9F' },
  hudPipe: {
    color: 'rgba(255,255,255,0.15)',
    fontSize: 11,
  },

  // Content
  content: {
    padding: 16,
    gap: 20,
    paddingBottom: 48,
  },

  // Title block
  titleBlock: {
    alignItems: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  titleEyebrow: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
  },
  titleMain: {
    fontFamily: 'SpaceMono',
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  titleSub: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
  },

  // Mission Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '47.5%',
    minHeight: 170,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 6,
    justifyContent: 'flex-end',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 10,
  },
  tileIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  tileLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    lineHeight: 20,
  },
  tileSub: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
  },
  statBadge: {
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 6,
  },
  statText: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // System Status
  statusBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  statusHeader: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    marginBottom: 4,
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
  },
  statusText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.8,
  },

  // Footer
  footer: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: 1.5,
    textAlign: 'center',
    paddingTop: 4,
  },
});
