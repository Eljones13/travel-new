import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Festival } from '../models/Festival';
import { COLORS, TYPOGRAPHY } from '../constants/Theme';

interface Props {
  festival: Festival;
  onPress: () => void;
}

function formatAttendance(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function scoreColor(score: number): string {
  if (score >= 80) return '#00FF88';    // Safe green
  if (score >= 60) return COLORS.gold;  // Caution gold
  return '#FF3E3E';                     // Danger red
}

export function TacticalFestivalCard({ festival, onPress }: Props) {
  const attendance = festival.expectedAttendance ?? 0;
  const blackoutRisk = attendance > 100_000;
  const score = festival.safetyScore ?? 50;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.festivalName} numberOfLines={1}>
          {festival.festivalName}
        </Text>
        {/* Safety Score badge */}
        <View style={[styles.scoreBadge, { borderColor: scoreColor(score), shadowColor: scoreColor(score) }]}>
          <Text style={[styles.scoreLabel, TYPOGRAPHY.monoSm]}>SAFETY</Text>
          <Text style={[styles.scoreValue, { color: scoreColor(score) }]}>{score}</Text>
        </View>
      </View>

      {/* Location */}
      <Text style={[styles.location, TYPOGRAPHY.monoSm]}>
        {festival.city ? `${festival.city}, ` : ''}{festival.country}
      </Text>

      {/* Vibe + attendance row */}
      <View style={styles.metaRow}>
        {festival.vibe ? (
          <View style={styles.vibePill}>
            <Text style={styles.vibeText}>{festival.vibe.toUpperCase()}</Text>
          </View>
        ) : null}
        {attendance > 0 && (
          <Text style={[styles.attendanceText, TYPOGRAPHY.monoSm]}>
            {formatAttendance(attendance)} ATT.
          </Text>
        )}
      </View>

      {/* SIGNAL BLACKOUT RISK warning */}
      {blackoutRisk && (
        <View style={styles.blackoutBanner}>
          <Text style={styles.blackoutText}>⚠ SIGNAL BLACKOUT RISK</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D0D0D',
    borderWidth: 0.5,
    borderColor: COLORS.cyan,
    borderRadius: 10,
    padding: 14,
    gap: 8,
    // iOS glow
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    // Android elevation
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  festivalName: {
    flex: 1,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  scoreBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    // glow — set dynamically via style prop
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  location: {
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vibePill: {
    borderWidth: 0.5,
    borderColor: 'rgba(0, 242, 255, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  vibeText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: COLORS.cyan,
    letterSpacing: 1,
  },
  attendanceText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
  },
  blackoutBanner: {
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: COLORS.magenta,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    shadowColor: COLORS.magenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  blackoutText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: COLORS.magenta,
    letterSpacing: 1.5,
    fontWeight: '700',
    textAlign: 'center',
  },
});
