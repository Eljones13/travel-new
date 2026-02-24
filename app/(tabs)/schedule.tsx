import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { withObservables, useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/db';
import { Stage } from '../../src/models/Stage';
import { Performance } from '../../src/models/Performance';
import { SquadSession } from '../../src/models/SquadSession';

// ── Survival Tips — injected as banners at specific Bangkok-hour windows ───────

type SurvivalTip = {
  fromHour: number; // Bangkok local hour (UTC+7)
  toHour: number;
  icon: string;
  message: string;
  itemName?: string;
  affiliateUrl?: string;
};

const SURVIVAL_TIPS: SurvivalTip[] = [
  {
    fromHour: 12,
    toHour: 16,
    icon: '☀️',
    message: "Sun's at its strongest! Did you pack your UV-Shield Sunglasses?",
    itemName: 'UV-Shield Sunglasses',
    affiliateUrl: 'https://amazon.com/uv-sunglasses?tag=travelravers01',
  },
  {
    fromHour: 16,
    toHour: 18,
    icon: '💧',
    message: 'Pre-headliner dehydration window. Hit the water station before the rush.',
  },
  {
    fromHour: 22,
    toHour: 24,
    icon: '👟',
    message: 'Crowd surge incoming. Stay close to an emergency exit — check the map.',
  },
];

function getTipForSlot(startTimeMs: number): SurvivalTip | null {
  const bangkokHour = new Date(startTimeMs + 7 * 3600 * 1000).getUTCHours();
  return SURVIVAL_TIPS.find((tip) => bangkokHour >= tip.fromHour && bangkokHour < tip.toHour) ?? null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const d = new Date(ms + 7 * 3600 * 1000); // shift to Bangkok time for display
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)} hr ago`;
}

function openLink(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener');
  } else {
    Linking.openURL(url);
  }
}

function stageColor(stage: Stage | undefined): string {
  return stage?.color || '#FF6B35';
}

// ── Survival Tip Banner ───────────────────────────────────────────────────────

function SurvivalTipBanner({ tip }: { tip: SurvivalTip }) {
  return (
    <View style={styles.tipBanner}>
      <Text style={styles.tipIcon}>{tip.icon}</Text>
      <View style={styles.tipBody}>
        <Text style={styles.tipMessage}>{tip.message}</Text>
        {tip.affiliateUrl && tip.itemName && (
          <TouchableOpacity onPress={() => openLink(tip.affiliateUrl!)} activeOpacity={0.75}>
            <Text style={styles.tipLink}>🛒 {tip.itemName}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Performance card ──────────────────────────────────────────────────────────

type PerfCardProps = { perf: Performance; isLive: boolean; color: string };

function PerformanceCard({ perf, isLive, color }: PerfCardProps) {
  return (
    <View
      style={[
        styles.perfCard,
        isLive && {
          backgroundColor: color + '10',
          borderRadius: 10,
          borderBottomColor: 'transparent',
        },
      ]}
    >
      <View style={styles.perfTime}>
        <Text style={[styles.perfTimeText, isLive && { color }]}>
          {formatTime(perf.startTime)}
        </Text>
        {isLive && <View style={[styles.liveDot, { backgroundColor: color }]} />}
      </View>
      <View style={styles.perfInfo}>
        <Text style={[styles.perfArtist, isLive && { color: '#FFFFFF' }]}>{perf.artist}</Text>
        <Text style={styles.perfDuration}>
          {formatTime(perf.startTime)} – {formatTime(perf.endTime)}
        </Text>
      </View>
      {isLive && (
        <View style={[styles.liveBadge, { backgroundColor: color + '25', borderColor: color + '60' }]}>
          <Text style={[styles.liveBadgeText, { color }]}>LIVE</Text>
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

type ScreenBaseProps = {
  stages: Stage[];
  performances: Performance[];
  sessions: SquadSession[];
};

function ScheduleScreenBase({ stages, performances, sessions }: ScreenBaseProps) {
  const db = useDatabase();
  const session = sessions[0] ?? null;

  const [selectedStageId, setSelectedStageId] = useState<string>(() => stages[0]?.id ?? '');

  const effectiveStageId = stages.some((s) => s.id === selectedStageId)
    ? selectedStageId
    : stages[0]?.id ?? '';

  const selectedStage = stages.find((s) => s.id === effectiveStageId);
  const color = stageColor(selectedStage);

  const stagePerformances = performances
    .filter((p) => p.stageId === effectiveStageId)
    .sort((a, b) => a.startTime - b.startTime);

  const now = Date.now();

  const handleCheckIn = useCallback(
    async (stage: Stage) => {
      if (!session) return;
      const alreadyHere = session.currentLocation === stage.stageName;
      await db.write(async () => {
        await session.update((r) => {
          r.currentLocation = alreadyHere ? '' : stage.stageName;
          r.lastUpdated = alreadyHere ? 0 : Date.now();
        });
      });
    },
    [db, session]
  );

  if (stages.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📅</Text>
        <Text style={styles.emptyTitle}>No Schedule Yet</Text>
        <Text style={styles.emptySub}>Lineup drops closer to the festival.</Text>
      </View>
    );
  }

  const isCheckedInHere = session?.currentLocation === selectedStage?.stageName;
  const checkedInStage = stages.find((s) => s.stageName === session?.currentLocation);

  return (
    <View style={styles.container}>
      {/* Festival bar */}
      <View style={styles.festivalBar}>
        <Text style={styles.festivalLabel}>S2O SONGKRAN 2026</Text>
        <Text style={styles.festivalDate}>12 APR · BANGKOK</Text>
      </View>

      {/* Rave Radar status */}
      {session?.currentLocation ? (
        <View style={styles.radarBanner}>
          <Text style={styles.radarIcon}>📍</Text>
          <Text style={styles.radarText}>
            <Text style={[styles.radarStage, { color: stageColor(checkedInStage) }]}>
              {session.currentLocation}
            </Text>
            {'  '}
            <Text style={styles.radarTime}>{session.lastUpdated ? timeAgo(session.lastUpdated) : ''}</Text>
          </Text>
        </View>
      ) : null}

      {/* Stage picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stagePicker}
        contentContainerStyle={styles.stagePickerContent}
      >
        {stages.map((stage) => {
          const isSelected = stage.id === effectiveStageId;
          const sc = stageColor(stage);
          return (
            <TouchableOpacity
              key={stage.id}
              style={[
                styles.stageChip,
                isSelected
                  ? { borderColor: sc, backgroundColor: sc + '22' }
                  : { borderColor: '#2A2A2A', backgroundColor: '#1A1A1A' },
              ]}
              onPress={() => setSelectedStageId(stage.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.stageChipText, isSelected && { color: sc }]}>
                {session?.currentLocation === stage.stageName ? '📍 ' : ''}
                {stage.stageName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* I Am Here button */}
      {session && (
        <TouchableOpacity
          style={[
            styles.checkInBtn,
            { borderColor: color },
            isCheckedInHere && { backgroundColor: color },
          ]}
          onPress={() => selectedStage && handleCheckIn(selectedStage)}
          activeOpacity={0.75}
        >
          <Text style={[styles.checkInBtnText, { color: isCheckedInHere ? '#000' : color }]}>
            {isCheckedInHere ? '✓ I Am Here' : '📍 I Am Here'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Timeline */}
      <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent}>
        {stagePerformances.map((perf, i) => {
          const isLive = now >= perf.startTime && now < perf.endTime;
          const tip = getTipForSlot(perf.startTime);
          const showTip =
            tip !== null &&
            (i === 0 ||
              getTipForSlot(stagePerformances[i - 1].startTime)?.fromHour !== tip.fromHour);

          return (
            <React.Fragment key={perf.id}>
              {showTip && <SurvivalTipBanner tip={tip!} />}
              <PerformanceCard perf={perf} isLive={isLive} color={color} />
            </React.Fragment>
          );
        })}
        {stagePerformances.length === 0 && (
          <Text style={styles.noPerfs}>No performances scheduled for this stage.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const EnhancedScheduleScreen = withObservables([], () => ({
  stages: database
    .get<Stage>('stages')
    .query(Q.where('festival_id', 'S2O Songkran'), Q.sortBy('stage_name', Q.asc))
    .observe(),
  performances: database
    .get<Performance>('performances')
    .query(Q.sortBy('start_time', Q.asc))
    .observe(),
  sessions: database.get<SquadSession>('squad_sessions').query().observe(),
}))(ScheduleScreenBase);

export default function ScheduleScreen() {
  return <EnhancedScheduleScreen />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  // Empty state
  empty: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  emptySub: { color: '#555', fontSize: 13 },
  // Festival bar
  festivalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  festivalLabel: { color: '#FF6B35', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  festivalDate: { color: '#555', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  // Radar banner
  radarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF08',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  radarIcon: { fontSize: 13 },
  radarText: { fontSize: 12, color: '#999' },
  radarStage: { fontWeight: '700' },
  radarTime: { color: '#555', fontSize: 11 },
  // Stage picker
  stagePicker: { maxHeight: 56, flexGrow: 0 },
  stagePickerContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stageChipText: { color: '#666', fontSize: 12, fontWeight: '600' },
  // I Am Here button
  checkInBtn: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  checkInBtnText: { fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  // Timeline
  timeline: { flex: 1 },
  timelineContent: { padding: 16 },
  // Performance card
  perfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  perfTime: { width: 60, alignItems: 'flex-end', gap: 4 },
  perfTimeText: { color: '#555', fontSize: 12, fontWeight: '600' },
  liveDot: { width: 6, height: 6, borderRadius: 3, alignSelf: 'flex-end' },
  perfInfo: { flex: 1 },
  perfArtist: { color: '#DDD', fontSize: 16, fontWeight: '700' },
  perfDuration: { color: '#444', fontSize: 11, marginTop: 3 },
  liveBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  liveBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  noPerfs: { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 24 },
  // Survival tip banner
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFD16612',
    borderWidth: 1,
    borderColor: '#FFD16630',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  tipIcon: { fontSize: 20 },
  tipBody: { flex: 1, gap: 4 },
  tipMessage: { color: '#DDD', fontSize: 12, lineHeight: 17 },
  tipLink: { color: '#FFD166', fontSize: 12, fontWeight: '700', marginTop: 2 },
});
