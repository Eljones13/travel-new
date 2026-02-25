import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/db';
import { Festival } from '../../src/models/Festival';
import { COLORS, TYPOGRAPHY } from '../../src/constants/Theme';

// ── Script Row ────────────────────────────────────────────────────────────────

function ScriptRow({ label, text }: { label: string; text: string }) {
  const handleShare = () => {
    Share.share({ message: text });
  };

  return (
    <TouchableOpacity style={styles.scriptRow} onPress={handleShare} activeOpacity={0.75}>
      <View style={styles.scriptLabelRow}>
        <Text style={styles.scriptLabel}>{label}</Text>
        <Text style={styles.shareTip}>TAP TO SHARE</Text>
      </View>
      <Text style={styles.scriptText}>{text}</Text>
    </TouchableOpacity>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
      <Text style={[styles.sectionHeaderText, { color }]}>{title}</Text>
    </View>
  );
}

// ── Detail screen ─────────────────────────────────────────────────────────────

type BaseProps = { festival: Festival | null };

function FestivalDetailBase({ festival }: BaseProps) {
  const router = useRouter();

  if (!festival) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>FESTIVAL NOT FOUND</Text>
      </View>
    );
  }

  const attendance = festival.expectedAttendance ?? 0;
  const blackout = attendance > 100_000;

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={[styles.backText, TYPOGRAPHY.monoSm]}>{'← DISCOVERY'}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title block */}
        <Text style={styles.titleName}>{festival.festivalName}</Text>
        <Text style={[styles.titleMeta, TYPOGRAPHY.monoSm]}>
          {festival.city ? `${festival.city} · ` : ''}{festival.country}
        </Text>
        {festival.vibe ? (
          <Text style={[styles.vibeTag]}>{festival.vibe.toUpperCase()}</Text>
        ) : null}

        {blackout && (
          <View style={styles.blackoutBanner}>
            <Text style={styles.blackoutText}>⚠ SIGNAL BLACKOUT RISK — {(attendance / 1000).toFixed(0)}K ATTENDEES</Text>
          </View>
        )}

        {/* Medical scripts */}
        <SectionHeader title="// MEDICAL PROTOCOLS" color="#FF3E3E" />
        {festival.medicalDoctor ? (
          <ScriptRow label="NEED A DOCTOR" text={festival.medicalDoctor} />
        ) : null}
        {festival.medicalAllergy ? (
          <ScriptRow label="ALLERGY ALERT" text={festival.medicalAllergy} />
        ) : null}
        {festival.scriptMedicalTent ? (
          <ScriptRow label="FIND MEDICAL TENT" text={festival.scriptMedicalTent} />
        ) : null}

        {/* Legal scripts */}
        <SectionHeader title="// LEGAL PROTOCOLS" color={COLORS.gold} />
        {festival.legalFreeToGo ? (
          <ScriptRow label="AM I FREE TO GO?" text={festival.legalFreeToGo} />
        ) : null}
        {festival.legalCallEmbassy ? (
          <ScriptRow label="CALL EMBASSY" text={festival.legalCallEmbassy} />
        ) : null}

        {/* Survival scripts */}
        <SectionHeader title="// SURVIVAL SCRIPTS" color={COLORS.cyan} />
        {festival.scriptLostSquad ? (
          <ScriptRow label="LOST SQUAD" text={festival.scriptLostSquad} />
        ) : null}
        {festival.scriptSubstance ? (
          <ScriptRow label="SUBSTANCE ASSIST" text={festival.scriptSubstance} />
        ) : null}
        {festival.scriptCharging ? (
          <ScriptRow label="PHONE CHARGING" text={festival.scriptCharging} />
        ) : null}

        {/* Language tag */}
        {festival.primaryLanguage ? (
          <View style={styles.languageTag}>
            <Text style={[TYPOGRAPHY.monoSm, { color: COLORS.textSecondary }]}>
              PRIMARY LANGUAGE: {festival.primaryLanguage.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ── Observable wrapper ────────────────────────────────────────────────────────

type EnhancedProps = { festivalId: string };

const FestivalDetailEnhanced = withObservables(['festivalId'], ({ festivalId }: EnhancedProps) => ({
  festival: database
    .get<Festival>('festivals')
    .query(Q.where('id', festivalId))
    .observeWithColumns(['festival_name', 'city', 'country', 'vibe', 'expected_attendance',
      'safety_score', 'primary_language', 'medical_doctor', 'medical_allergy',
      'legal_free_to_go', 'legal_call_embassy', 'script_lost_squad', 'script_substance',
      'script_medical_tent', 'script_charging']),
}))(({ festival, ...rest }: { festival: Festival[]; festivalId: string }) =>
  // withObservables returns an array for query, pick first
  <FestivalDetailBase festival={festival[0] ?? null} {...rest} />
);

export default function FestivalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  return <FestivalDetailEnhanced festivalId={id} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backText: {
    color: COLORS.cyan,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  titleName: {
    fontFamily: 'SpaceMono',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  titleMeta: {
    color: COLORS.textSecondary,
  },
  vibeTag: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: COLORS.cyan,
    letterSpacing: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,242,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  blackoutBanner: {
    backgroundColor: 'rgba(255,0,255,0.1)',
    borderWidth: 0.5,
    borderColor: COLORS.magenta,
    borderRadius: 6,
    padding: 10,
  },
  blackoutText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: COLORS.magenta,
    letterSpacing: 1,
    fontWeight: '700',
  },
  sectionHeader: {
    borderLeftWidth: 2,
    paddingLeft: 10,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  scriptRow: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  scriptLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scriptLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  shareTip: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: 'rgba(0,242,255,0.5)',
    letterSpacing: 1,
  },
  scriptText: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  languageTag: {
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  notFound: {
    ...TYPOGRAPHY.monoMd,
    textAlign: 'center',
    marginTop: 40,
  },
});
