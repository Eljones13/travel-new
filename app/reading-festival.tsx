import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

// ── Types ──────────────────────────────────────────────────────────────────

type FloodLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

const FLOOD_CONFIG: Record<FloodLevel, { color: string; fill: number; advice: string }> = {
  LOW:      { color: '#00FF9F', fill: 0.15, advice: 'Ground is firm. Normal footwear OK.' },
  MODERATE: { color: '#FFD166', fill: 0.42, advice: 'Wellies strongly recommended. Avoid valley pitches.' },
  HIGH:     { color: '#FF6B35', fill: 0.70, advice: 'Move tent to elevated ground. Do NOT pitch near the Thames.' },
  CRITICAL: { color: '#FF3E3E', fill: 0.92, advice: 'Evacuation possible. Follow steward instructions immediately.' },
};

// Static: Reading 2025 ground conditions — update each year from Environment Agency
const CURRENT_FLOOD_LEVEL: FloodLevel = 'MODERATE';

// ── Flood Risk Gauge ───────────────────────────────────────────────────────

function FloodGauge() {
  const cfg = FLOOD_CONFIG[CURRENT_FLOOD_LEVEL];
  return (
    <View style={gaugeStyles.container}>
      <View style={gaugeStyles.header}>
        <Text style={gaugeStyles.label}>FLOOD RISK GAUGE</Text>
        <Text style={[gaugeStyles.level, { color: cfg.color }]}>{CURRENT_FLOOD_LEVEL}</Text>
      </View>

      {/* Track */}
      <View style={gaugeStyles.track}>
        <View
          style={[
            gaugeStyles.fill,
            {
              width: `${cfg.fill * 100}%` as any,
              backgroundColor: cfg.color,
              shadowColor: cfg.color,
            },
          ]}
        />
        {/* Tick marks */}
        {[0.25, 0.5, 0.75].map((pos) => (
          <View
            key={pos}
            style={[gaugeStyles.tick, { left: `${pos * 100}%` as any }]}
          />
        ))}
      </View>

      {/* Scale labels */}
      <View style={gaugeStyles.scaleRow}>
        {(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as FloodLevel[]).map((lvl) => (
          <Text
            key={lvl}
            style={[
              gaugeStyles.scaleLabel,
              lvl === CURRENT_FLOOD_LEVEL && { color: cfg.color },
            ]}
          >
            {lvl}
          </Text>
        ))}
      </View>

      <View style={[gaugeStyles.advice, { borderColor: cfg.color + '55' }]}>
        <Text style={[gaugeStyles.adviceText, { color: cfg.color }]}>⚠ {cfg.advice}</Text>
      </View>

      <Text style={gaugeStyles.source}>
        SOURCE: Environment Agency · Last sync: Aug 2025
      </Text>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  level: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  track: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.5,
  },
  advice: {
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  adviceText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    lineHeight: 17,
    letterSpacing: 0.3,
  },
  source: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.5,
  },
});

// ── Tent Finder ────────────────────────────────────────────────────────────

type CampZone = { code: string; name: string; bearing: string; walk: string; color: string };

const CAMP_ZONES: CampZone[] = [
  { code: 'A1', name: 'ALPHA RIDGE', bearing: '012°', walk: '4 MIN', color: '#00F2FF' },
  { code: 'B3', name: 'BRAVO FLAT', bearing: '087°', walk: '7 MIN', color: '#00FF9F' },
  { code: 'C7', name: 'CHARLIE HILL', bearing: '154°', walk: '11 MIN', color: '#FFD166' },
  { code: 'D2', name: 'DELTA MARSH', bearing: '241°', walk: '6 MIN', color: '#FF6B35' },
];

function TentFinder() {
  const [selected, setSelected] = useState<string>('A1');
  const zone = CAMP_ZONES.find((z) => z.code === selected)!;

  return (
    <View style={tentStyles.container}>
      <Text style={tentStyles.sectionLabel}>TENT FINDER · CAMPSITE GRID</Text>

      {/* Zone selector */}
      <View style={tentStyles.zoneRow}>
        {CAMP_ZONES.map((z) => (
          <TouchableOpacity
            key={z.code}
            style={[
              tentStyles.zoneChip,
              selected === z.code && { borderColor: z.color, backgroundColor: z.color + '22' },
            ]}
            onPress={() => setSelected(z.code)}
          >
            <Text
              style={[
                tentStyles.zoneCode,
                selected === z.code && { color: z.color },
              ]}
            >
              {z.code}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected zone detail */}
      <View style={[tentStyles.detail, { borderColor: zone.color + '44' }]}>
        <View style={tentStyles.detailRow}>
          <Text style={tentStyles.detailKey}>ZONE</Text>
          <Text style={[tentStyles.detailVal, { color: zone.color }]}>{zone.name}</Text>
        </View>
        <View style={tentStyles.detailRow}>
          <Text style={tentStyles.detailKey}>BEARING</Text>
          <Text style={tentStyles.detailVal}>{zone.bearing} MAGNETIC</Text>
        </View>
        <View style={tentStyles.detailRow}>
          <Text style={tentStyles.detailKey}>WALK TIME</Text>
          <Text style={tentStyles.detailVal}>{zone.walk} EST.</Text>
        </View>
        <View style={tentStyles.detailRow}>
          <Text style={tentStyles.detailKey}>STATUS</Text>
          <Text style={[tentStyles.detailVal, { color: '#00FF9F' }]}>OPEN · DRY GROUND</Text>
        </View>
      </View>

      <Text style={tentStyles.placeholder}>
        // TENT FINDER v0.1 — GPS integration pending.{'\n'}
        Tap a zone to view bearing from main stage entrance.{'\n'}
        Full grid unlock requires location permission.
      </Text>
    </View>
  );
}

const tentStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  zoneRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  zoneChip: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  zoneCode: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  detail: {
    borderWidth: 0.5,
    borderRadius: 10,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
    width: 90,
  },
  detailVal: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'right',
  },
  placeholder: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.5,
    lineHeight: 15,
    fontStyle: 'italic',
  },
});

// ── Survival script rows ───────────────────────────────────────────────────

type ScriptRow = { trigger: string; script: string; accent: string };

const SCRIPTS: ScriptRow[] = [
  {
    trigger: 'LOST YOUR SQUAD',
    script:
      'Head to the MAIN STAGE left barrier (steward station). Say: "I\'m separated from my group. Can you broadcast on your radio?" Stay put — do not wander. Set a 10-min check-in on your phone.',
    accent: '#00F2FF',
  },
  {
    trigger: 'MEDICAL TENT',
    script:
      'Say: "My friend is [not responding / overheating / having a seizure]. They took [substance/nothing]. Please help." Welfare staff are confidential — be honest. Never leave them alone.',
    accent: '#FF3E3E',
  },
  {
    trigger: 'STOP & SEARCH',
    script:
      '"Am I being detained?" — wait for answer. If yes: "I do not consent to this search. Please note my objection." Stay calm, record if safe to do so. Demand written record (S.1 PACE).',
    accent: '#FFD166',
  },
  {
    trigger: 'PHONE DEAD',
    script:
      'Free charging: accessible in the Welfare tent. Charging lockers near main arena — bring a padlock. Rendezvous point: left of Main Stage screen. Tell your squad the plan BEFORE you split.',
    accent: '#00FF9F',
  },
  {
    trigger: 'EXTREME HEAT',
    script:
      'Move to shaded area immediately. Sip water slowly — do not chug. Pour water on wrists/neck. If dizzy or confused: lie down, legs elevated, get help. Reading Medical is 200m from Main Stage.',
    accent: '#FF6B35',
  },
];

function ScriptCard({ s }: { s: ScriptRow }) {
  return (
    <View style={[scriptStyles.card, { borderLeftColor: s.accent }]}>
      <Text style={[scriptStyles.trigger, { color: s.accent }]}>IF: {s.trigger}</Text>
      <Text style={scriptStyles.text}>{s.script}</Text>
    </View>
  );
}

const scriptStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 14,
    gap: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  trigger: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────

export default function ReadingFestivalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerMain}>READING FESTIVAL</Text>
          <Text style={styles.headerSub}>SURVIVAL INTEL · OFFLINE</Text>
        </View>
        <View style={styles.flagBadge}>
          <Text style={styles.flagText}>🇬🇧</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaLabel}>SITE</Text>
            <Text style={styles.metaValue}>Richfield Ave, Reading</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaLabel}>DATES</Text>
            <Text style={styles.metaValue}>21–23 Aug 2026</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaLabel}>CAPACITY</Text>
            <Text style={styles.metaValue}>105,000</Text>
          </View>
        </View>

        {/* Flood Risk Gauge */}
        <Text style={styles.sectionLabel}>// FLOOD RISK ASSESSMENT</Text>
        <FloodGauge />

        {/* Tent Finder */}
        <Text style={styles.sectionLabel}>// TENT FINDER</Text>
        <TentFinder />

        {/* Survival Scripts */}
        <Text style={styles.sectionLabel}>// SURVIVAL SCRIPTS</Text>
        <Text style={styles.scriptIntro}>
          Say these words exactly. Tested phrases get faster results.
        </Text>
        {SCRIPTS.map((s) => (
          <ScriptCard key={s.trigger} s={s} />
        ))}

        {/* Emergency footer */}
        <View style={styles.emergencyFooter}>
          <Text style={styles.emergencyText}>
            🆘  EMERGENCY: 999  ·  EU: 112  ·  FRANK: 0300 123 6600
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Screen styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  backBtn: {},
  backText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#00F2FF',
    letterSpacing: 1,
  },
  headerTitle: {
    flex: 1,
    gap: 2,
  },
  headerMain: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  headerSub: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
  },
  flagBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 20,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 48,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    flex: 1,
    minWidth: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  metaLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
  },
  metaValue: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    marginTop: 8,
  },
  scriptIntro: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
    lineHeight: 16,
    marginBottom: 2,
  },
  emergencyFooter: {
    marginTop: 8,
    backgroundColor: 'rgba(255,62,62,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,62,62,0.4)',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  emergencyText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#FF3E3E',
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
