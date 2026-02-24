import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { withObservables, useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/db';
import { SquadSession } from '../../src/models/SquadSession';
import { PackingItem } from '../../src/models/PackingItem';
import { Stage } from '../../src/models/Stage';
import QRDisplay from '../../src/components/QRDisplay';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSquadCode(): string {
  // No O/0 or I/1 to avoid confusion when reading aloud in the dark
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── No-squad view ─────────────────────────────────────────────────────────────

type NoSquadProps = {
  onCreated: (code: string, name: string) => void;
  onJoined: (code: string, name: string) => void;
};

function NoSquadView({ onCreated, onJoined }: NoSquadProps) {
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.noSquadContainer}>
      <Text style={styles.emoji}>👥</Text>
      <Text style={styles.title}>Squad Sync</Text>
      <Text style={styles.subtitle}>
        Share your packing list with your crew.{'\n'}
        Claim items so no one doubles up.
      </Text>

      {mode === 'idle' && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setMode('create')}>
            <Text style={styles.primaryBtnText}>Create Squad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('join')}>
            <Text style={styles.secondaryBtnText}>Join Squad</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'create' && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>YOUR NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jake, Sarah, DJ_Hype..."
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={24}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, !name.trim() && styles.btnDisabled]}
            onPress={() => name.trim() && onCreated(generateSquadCode(), name.trim())}
          >
            <Text style={styles.primaryBtnText}>Create & Share Code</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('idle')}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'join' && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>YOUR NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jake, Sarah, DJ_Hype..."
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={24}
          />
          <Text style={[styles.formLabel, { marginTop: 12 }]}>SQUAD CODE</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="ABCDEF"
            placeholderTextColor="#555"
            value={joinCode}
            onChangeText={(t) => setJoinCode(t.toUpperCase().slice(0, 6))}
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, (!name.trim() || joinCode.length < 6) && styles.btnDisabled]}
            onPress={() => name.trim() && joinCode.length === 6 && onJoined(joinCode, name.trim())}
          >
            <Text style={styles.primaryBtnText}>Join Squad</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('idle')}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ── Squad Finance ─────────────────────────────────────────────────────────────

type SquadFinanceProps = {
  claimedByMe: PackingItem[];
  claimedByOthers: PackingItem[];
  unclaimed: PackingItem[];
  allSquadItems: PackingItem[];
};

function SquadFinance({ claimedByMe, claimedByOthers, unclaimed, allSquadItems }: SquadFinanceProps) {
  const sum = (items: PackingItem[]) =>
    items.reduce((acc, i) => acc + (i.price ?? 0), 0);

  const groupTotal = sum(allSquadItems.filter((i) => i.price > 0));
  const yourShare = sum(claimedByMe.filter((i) => i.price > 0));
  const groupSavings = sum(claimedByOthers.filter((i) => i.isGroupItem && i.price > 0));
  const unclaimedBudget = sum(unclaimed.filter((i) => i.price > 0));

  // Best upsell: highest-price unclaimed item with an affiliate URL
  const topUpsell = unclaimed
    .filter((i) => i.affiliateUrl && i.price > 0)
    .sort((a, b) => b.price - a.price)[0] ?? null;

  if (groupTotal === 0) return null;

  const handleUpsell = () => {
    if (!topUpsell?.affiliateUrl) return;
    if (Platform.OS === 'web') {
      window.open(topUpsell.affiliateUrl, '_blank', 'noopener');
    } else {
      Linking.openURL(topUpsell.affiliateUrl);
    }
  };

  return (
    <View style={styles.financeCard}>
      <Text style={styles.sectionLabel}>SQUAD FINANCE</Text>
      <View style={styles.financeGrid}>
        <View style={styles.financeStat}>
          <Text style={styles.financeValue}>£{groupTotal.toFixed(0)}</Text>
          <Text style={styles.financeLabel}>Group Total</Text>
        </View>
        <View style={styles.financeStat}>
          <Text style={[styles.financeValue, { color: '#FF00FF' }]}>£{yourShare.toFixed(0)}</Text>
          <Text style={styles.financeLabel}>Your Share</Text>
        </View>
        {groupSavings > 0 && (
          <View style={styles.financeStat}>
            <Text style={[styles.financeValue, { color: '#00FF88' }]}>£{groupSavings.toFixed(0)}</Text>
            <Text style={styles.financeLabel}>Crew Covers</Text>
          </View>
        )}
        {unclaimedBudget > 0 && (
          <View style={styles.financeStat}>
            <Text style={[styles.financeValue, { color: '#FFD166' }]}>£{unclaimedBudget.toFixed(0)}</Text>
            <Text style={styles.financeLabel}>Unclaimed</Text>
          </View>
        )}
      </View>

      {topUpsell && (
        <TouchableOpacity style={styles.upsellRow} onPress={handleUpsell} activeOpacity={0.75}>
          <View style={styles.upsellText}>
            <Text style={styles.upsellName} numberOfLines={1}>{topUpsell.itemName}</Text>
            <Text style={styles.upsellPrice}>£{topUpsell.price.toFixed(0)} — nobody's claimed it</Text>
          </View>
          <Text style={styles.upsellCta}>🛒 Grab it</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Active squad view ─────────────────────────────────────────────────────────

// ── Time elapsed helper ───────────────────────────────────────────────────────

function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)} hr ago`;
}

type ActiveSquadProps = {
  session: SquadSession;
  squadItems: PackingItem[];
  stages: Stage[];
  onLeave: () => void;
};

function ActiveSquadView({ session, squadItems, stages, onLeave }: ActiveSquadProps) {
  const db = useDatabase();

  const claimItem = useCallback(async (item: PackingItem) => {
    await db.write(async () => {
      await item.update((r) => {
        r.assignedTo = item.assignedTo === session.displayName ? '' : session.displayName;
      });
    });
  }, [db, session.displayName]);

  const claimedByMe = squadItems.filter((i) => i.assignedTo === session.displayName);
  const claimedByOthers = squadItems.filter((i) => i.assignedTo && i.assignedTo !== session.displayName);
  const unclaimed = squadItems.filter((i) => !i.assignedTo);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.activeContainer}>
      {/* Header */}
      <View style={styles.squadHeader}>
        <View>
          <Text style={styles.squadName}>{session.displayName}</Text>
          <Text style={styles.squadRole}>{session.isLeader ? 'Squad Leader' : 'Squad Member'}</Text>
        </View>
        <View style={[styles.badge, { borderColor: '#FF00FF' }]}>
          <Text style={[styles.badgeText, { color: '#FF00FF' }]}>
            {session.isLeader ? '👑 LEADER' : '🎪 MEMBER'}
          </Text>
        </View>
      </View>

      {/* Rave Radar — current stage location */}
      {session.currentLocation ? (
        <View style={styles.radarRow}>
          <Text style={styles.radarIcon}>📍</Text>
          <Text style={styles.radarText}>
            <Text style={styles.radarStage}>{session.displayName}</Text>
            <Text style={styles.radarAt}> @ </Text>
            <Text style={styles.radarStage}>{session.currentLocation}</Text>
            {'  '}
            <Text style={styles.radarTime}>
              {session.lastUpdated ? timeAgo(session.lastUpdated) : ''}
            </Text>
          </Text>
        </View>
      ) : null}

      {/* QR Code + Code */}
      <View style={styles.qrSection}>
        <Text style={styles.sectionLabel}>RAVE QR — SHARE WITH CREW</Text>
        <View style={styles.qrRow}>
          <QRDisplay value={session.squadCode} size={160} />
          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}>CODE</Text>
            <Text style={styles.bigCode}>{session.squadCode}</Text>
            <Text style={styles.codeHint}>
              {squadItems.length} item{squadItems.length !== 1 ? 's' : ''} in squad
            </Text>
          </View>
        </View>
      </View>

      {/* Squad Finance */}
      <SquadFinance
        claimedByMe={claimedByMe}
        claimedByOthers={claimedByOthers}
        unclaimed={unclaimed}
        allSquadItems={squadItems}
      />

      {/* Claimed by me */}
      {claimedByMe.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {session.currentLocation
              ? `${session.displayName} @ ${session.currentLocation} — ${claimedByMe.length} item${claimedByMe.length !== 1 ? 's' : ''}`
              : `YOUR CLAIMS (${claimedByMe.length})`}
          </Text>
          {claimedByMe.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              currentUser={session.displayName}
              onClaim={claimItem}
            />
          ))}
        </View>
      )}

      {/* Claimed by others */}
      {claimedByOthers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TAKEN BY CREW</Text>
          {claimedByOthers.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              currentUser={session.displayName}
              onClaim={claimItem}
            />
          ))}
        </View>
      )}

      {/* Unclaimed */}
      {unclaimed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>UNCLAIMED — GRAB SOMETHING</Text>
          {unclaimed.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              currentUser={session.displayName}
              onClaim={claimItem}
            />
          ))}
        </View>
      )}

      {/* Leave */}
      <TouchableOpacity style={styles.leaveBtn} onPress={onLeave}>
        <Text style={styles.leaveBtnText}>Leave Squad</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Item row (squad view) ─────────────────────────────────────────────────────

type ItemRowProps = {
  item: PackingItem;
  currentUser: string;
  onClaim: (item: PackingItem) => void;
};

const ItemRowBase = ({ item, currentUser, onClaim }: ItemRowProps) => {
  const isMineClaimed = item.assignedTo === currentUser;
  const isOthersClaimed = item.assignedTo && item.assignedTo !== currentUser;

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        {item.assignedTo ? (
          <Text style={[styles.claimedBy, isMineClaimed && styles.claimedByMe]}>
            {isMineClaimed ? '→ You' : `→ ${item.assignedTo}`}
          </Text>
        ) : null}
      </View>
      {!isOthersClaimed && (
        <TouchableOpacity
          style={[styles.claimBtn, isMineClaimed && styles.claimBtnActive]}
          onPress={() => onClaim(item)}
        >
          <Text style={[styles.claimBtnText, isMineClaimed && styles.claimBtnTextActive]}>
            {isMineClaimed ? 'Release' : 'Claim'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const ItemRow = withObservables(['item'], ({ item }: { item: PackingItem }) => ({
  item: item.observe(),
}))(ItemRowBase);

// ── Main screen ───────────────────────────────────────────────────────────────

type ScreenBaseProps = {
  sessions: SquadSession[];
  packingItems: PackingItem[];
  stages: Stage[];
};

function SquadScreenBase({ sessions, packingItems, stages }: ScreenBaseProps) {
  const db = useDatabase();
  const session = sessions[0] ?? null;

  const handleCreate = useCallback(async (code: string, name: string) => {
    await db.write(async () => {
      await db.get<SquadSession>('squad_sessions').create((r) => {
        r.squadCode = code;
        r.displayName = name;
        r.isLeader = true;
      });
      // Assign all existing packing items to this squad
      await Promise.all(
        packingItems.map((item) =>
          item.update((r) => { r.squadId = code; })
        )
      );
    });
  }, [db, packingItems]);

  const handleJoin = useCallback(async (code: string, name: string) => {
    await db.write(async () => {
      await db.get<SquadSession>('squad_sessions').create((r) => {
        r.squadCode = code;
        r.displayName = name;
        r.isLeader = false;
      });
      await Promise.all(
        packingItems.map((item) =>
          item.update((r) => { r.squadId = code; })
        )
      );
    });
  }, [db, packingItems]);

  const handleLeave = useCallback(async () => {
    Alert.alert('Leave Squad?', 'Your items will stay on your list but lose squad assignment.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          await db.write(async () => {
            await session!.destroyPermanently();
            await Promise.all(
              packingItems
                .filter((i) => i.squadId)
                .map((item) =>
                  item.update((r) => {
                    r.squadId = '';
                    r.assignedTo = '';
                  })
                )
            );
          });
        },
      },
    ]);
  }, [db, session, packingItems]);

  if (!session) {
    return <NoSquadView onCreated={handleCreate} onJoined={handleJoin} />;
  }

  const squadItems = packingItems.filter((i) => i.squadId === session.squadCode);

  return (
    <ActiveSquadView
      session={session}
      squadItems={squadItems}
      stages={stages}
      onLeave={handleLeave}
    />
  );
}

const EnhancedSquadScreen = withObservables([], () => ({
  sessions: database.get<SquadSession>('squad_sessions').query().observe(),
  packingItems: database
    .get<PackingItem>('packing_items')
    .query(Q.sortBy('created_at', Q.asc))
    .observe(),
  stages: database.get<Stage>('stages').query().observe(),
}))(SquadScreenBase);

export default function SquadScreen() {
  return <EnhancedSquadScreen />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  noSquadContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  activeContainer: { padding: 16, gap: 20 },
  emoji: { fontSize: 48 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  form: { width: '100%', gap: 8, marginTop: 8 },
  formLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  codeInput: {
    letterSpacing: 8,
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#FF00FF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#FF00FF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  secondaryBtnText: { color: '#FF00FF', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.4 },
  cancelText: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 8 },
  // Active squad
  squadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  squadName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  squadRole: { color: '#666', fontSize: 12, marginTop: 2 },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  qrSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF00FF22',
    gap: 12,
  },
  qrRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  codeBlock: { flex: 1, gap: 4 },
  codeLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bigCode: {
    color: '#FF00FF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
  },
  codeHint: { color: '#555', fontSize: 12 },
  section: { gap: 8 },
  sectionLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { color: '#FFF', fontSize: 15 },
  claimedBy: { color: '#888', fontSize: 12, marginTop: 2 },
  claimedByMe: { color: '#FF00FF' },
  claimBtn: {
    borderWidth: 1,
    borderColor: '#FF00FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  claimBtnActive: { backgroundColor: '#FF00FF' },
  claimBtnText: { color: '#FF00FF', fontSize: 13, fontWeight: '700' },
  claimBtnTextActive: { color: '#000' },
  leaveBtn: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  leaveBtnText: { color: '#555', fontSize: 14 },
  // Rave Radar location banner
  radarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B3512',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FF6B3530',
  },
  radarIcon: { fontSize: 14 },
  radarText: { flex: 1, fontSize: 13 },
  radarStage: { color: '#FF6B35', fontWeight: '700' },
  radarAt: { color: '#555' },
  radarTime: { color: '#555', fontSize: 12 },
  // Squad Finance
  financeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD16622',
    gap: 12,
  },
  financeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  financeStat: {
    flex: 1,
    minWidth: 70,
    gap: 2,
  },
  financeValue: {
    color: '#FF6B35',
    fontSize: 22,
    fontWeight: '800',
  },
  financeLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  upsellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFD16633',
    gap: 10,
  },
  upsellText: { flex: 1 },
  upsellName: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  upsellPrice: { color: '#666', fontSize: 11, marginTop: 2 },
  upsellCta: { color: '#FFD166', fontSize: 13, fontWeight: '700' },
});
