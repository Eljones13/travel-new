import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { withObservables, useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/db';
import { PackingItem, WeatherTrigger } from '../../src/models/PackingItem';
import { Performance } from '../../src/models/Performance';
import { Stage } from '../../src/models/Stage';
import { COLORS, GLASS_STYLE, TYPOGRAPHY, TACTICAL_GLOW, CYAN_GLOW, getZoneColor } from '../../src/constants/Theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Bangkok UTC+7 — matches offset used throughout schedule.tsx
function fmt24(ms: number): string {
  const d = new Date(ms + 7 * 3600 * 1000);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ── Next Set Card ─────────────────────────────────────────────────────────────
// Self-contained: subscribes to its own DB observables so PackingListBase
// stays unaffected. Ticks every 60s so the countdown stays current.

type NextSetBaseProps = { performances: Performance[]; stages: Stage[] };

function NextSetCardBase({ performances, stages }: NextSetBaseProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // First performance that hasn't ended yet (array already sorted start_time asc)
  const nextPerf = performances.find((p) => p.endTime > now) ?? null;
  if (!nextPerf) return null;

  const stage      = stages.find((s) => s.id === nextPerf.stageId) ?? null;
  const zoneColor  = getZoneColor(stage?.stageName ?? '');
  const isLive     = now >= nextPerf.startTime;
  const minsUntil  = Math.max(0, Math.floor((nextPerf.startTime - now) / 60_000));
  const countdown  = isLive ? 'LIVE NOW' : minsUntil < 60
    ? `IN ${minsUntil} MIN`
    : `IN ${Math.floor(minsUntil / 60)}H ${minsUntil % 60}M`;

  return (
    <View
      style={[
        styles.nextSetCard,
        GLASS_STYLE,
        {
          borderColor: zoneColor,
          borderWidth: 1.5,
          shadowColor: zoneColor,
          ...TACTICAL_GLOW,
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.nextSetHeader}>
        <Text style={styles.nextSetLabel}>NEXT SET</Text>
        <View style={[styles.countdownBadge, { borderColor: zoneColor + '88' }]}>
          <Text style={[styles.countdownText, { color: isLive ? zoneColor : COLORS.textSecondary }]}>
            {countdown}
          </Text>
        </View>
      </View>

      {/* Artist */}
      <Text style={styles.nextSetArtist} numberOfLines={1}>{nextPerf.artist}</Text>

      {/* Stage + time row */}
      <View style={styles.nextSetMeta}>
        <Text style={[styles.nextSetStage, { color: zoneColor }]} numberOfLines={1}>
          {stage?.stageName ?? '—'}
        </Text>
        <Text style={styles.nextSetTime}>
          {fmt24(nextPerf.startTime)}–{fmt24(nextPerf.endTime)}
        </Text>
      </View>
    </View>
  );
}

const NextSetCard = withObservables([], () => ({
  performances: database
    .get<Performance>('performances')
    .query(Q.sortBy('start_time', Q.asc))
    .observe(),
  stages: database.get<Stage>('stages').query().observe(),
}))(NextSetCardBase);

// ── Offline Status Bar ─────────────────────────────────────────────────────────

function OfflineBanner() {
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineDot}>●</Text>
      <Text style={styles.offlineText}>OFFLINE MODE: ACTIVE</Text>
    </View>
  );
}

// ── Row Component ──────────────────────────────────────────────────────────────
// Each row independently observes its own record so only the toggled row re-renders.

type RowBaseProps = { item: PackingItem };

const PackingItemRowBase = ({ item }: RowBaseProps) => {
  const db = useDatabase();

  const togglePacked = useCallback(async () => {
    await db.write(async () => {
      await item.update((record) => {
        record.isPacked = !record.isPacked;
      });
    });
  }, [item, db]);

  const openAffiliate = useCallback(() => {
    if (!item.affiliateUrl) return;
    if (Platform.OS === 'web') {
      window.open(item.affiliateUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(item.affiliateUrl);
    }
  }, [item.affiliateUrl]);

  return (
    <TouchableOpacity style={[styles.row, GLASS_STYLE, CYAN_GLOW]} onPress={togglePacked} activeOpacity={0.7}>
      <View style={[styles.checkbox, item.isPacked && styles.checkboxChecked]}>
        {item.isPacked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.itemName, item.isPacked && styles.itemNamePacked]}>
          {item.itemName}
        </Text>
        {item.category ? (
          <Text style={styles.category}>{item.category}</Text>
        ) : null}
        {item.weatherTrigger !== 'none' ? (
          <Text style={styles.weatherBadge}>{item.weatherTrigger.replace('_', ' ')}</Text>
        ) : null}
        {item.assignedTo ? (
          <Text style={styles.assignedTo}>→ {item.assignedTo}</Text>
        ) : null}
      </View>
      {item.affiliateUrl ? (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={openAffiliate}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const PackingItemRow = withObservables(['item'], ({ item }: RowBaseProps) => ({
  item: item.observe(),
}))(PackingItemRowBase);

// ── List Component ─────────────────────────────────────────────────────────────
// Driven by withObservables: re-renders the instant a DB write commits. No loading states.

type ListBaseProps = { packingItems: PackingItem[] };

const PackingListBase = ({ packingItems }: ListBaseProps) => {
  const db = useDatabase();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');

  const addItem = useCallback(async () => {
    const trimmed = itemName.trim();
    if (!trimmed) {
      Alert.alert('Item name required', 'Enter a name before adding to your pack.');
      return;
    }

    // Write to local SQLite — zero network path, no spinner
    await db.write(async () => {
      await db.get<PackingItem>('packing_items').create((record) => {
        record.itemName = trimmed;
        record.category = category.trim() || 'General';
        record.isPacked = false;
        record.weatherTrigger = 'none' as WeatherTrigger;
      });
    });

    setItemName('');
    setCategory('');
  }, [itemName, category, db]);

  const packedCount = packingItems.filter((i) => i.isPacked).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OfflineBanner />
      <NextSetCard />

      {/* Add Item Form */}
      <View style={[styles.form, GLASS_STYLE, CYAN_GLOW]}>
        <TextInput
          style={styles.input}
          placeholder="Add item (e.g. Tent, Rain poncho...)"
          placeholderTextColor="#555"
          value={itemName}
          onChangeText={setItemName}
          onSubmitEditing={addItem}
          returnKeyType="done"
          autoCapitalize="words"
        />
        <TextInput
          style={[styles.input, styles.inputSecondary]}
          placeholder="Category (e.g. Shelter, Clothing)"
          placeholderTextColor="#555"
          value={category}
          onChangeText={setCategory}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>ADD TO PACK</Text>
        </TouchableOpacity>
      </View>

      {/* Item Count */}
      <Text style={styles.countText}>
        {packedCount} / {packingItems.length} packed
      </Text>

      {/* FlashList — recycled cells, fast for large packing lists */}
      <FlashList
        data={packingItems}
        renderItem={({ item }) => <PackingItemRow item={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={60}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Your pack is empty.{'\n'}Add your first item above.
          </Text>
        }
      />
    </KeyboardAvoidingView>
  );
};

// Subscribe to ALL packing_items sorted by creation time.
// The observable fires instantly on each DB write — no async state needed.
const EnhancedPackingList = withObservables([], () => ({
  packingItems: database
    .get<PackingItem>('packing_items')
    .query(Q.sortBy('created_at', Q.asc))
    .observe(),
}))(PackingListBase);

export default function PackingListScreen() {
  return <EnhancedPackingList />;
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // ── Offline Banner ───────────────────────────────────────────────────────────
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 7,
    backgroundColor: 'rgba(0, 242, 255, 0.06)',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.glassBorder,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  offlineDot: {
    color: COLORS.cyan,
    fontSize: 8,
  },
  offlineText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  // ── Next Set Card ─────────────────────────────────────────────────────────────
  nextSetCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    gap: 6,
  },
  nextSetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextSetLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
  },
  countdownBadge: {
    borderWidth: 0.5,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countdownText: {
    ...TYPOGRAPHY.monoSm,
  },
  nextSetArtist: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  nextSetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nextSetStage: {
    ...TYPOGRAPHY.monoSm,
    flex: 1,
  },
  nextSetTime: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.textSecondary,
  },
  // ── Form ─────────────────────────────────────────────────────────────────────
  form: {
    margin: 16,
    padding: 16,
    gap: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: COLORS.glassBorder,
  },
  inputSecondary: {
    fontSize: 14,
  },
  addButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  // ── List ─────────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  countText: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    minHeight: 60,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.cyan,
  },
  checkmark: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  itemNamePacked: {
    color: '#555',
    textDecorationLine: 'line-through',
  },
  category: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  weatherBadge: {
    color: COLORS.orange,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assignedTo: {
    color: COLORS.magenta,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  cartButton: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    fontSize: 18,
  },
  emptyText: {
    color: '#555',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
});
