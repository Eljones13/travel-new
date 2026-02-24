import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { withObservables, useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/db';
import { Festival } from '../../src/models/Festival';
import { PackingItem, WeatherTrigger } from '../../src/models/PackingItem';
import FestivalMap, { FestivalPin } from '../../src/components/FestivalMap';
import { TACTICAL_MARKERS } from '../../src/constants/tacticalMarkers';

// ── Wet trigger items added when attending a 'wet' festival ───────────────────

const WET_TRIGGER_ITEMS = [
  {
    itemName: 'Waterproof Phone Pouch',
    category: 'Electronics',
    affiliateUrl: 'https://amazon.com/waterproof-phone-pouch?tag=travelravers01',
  },
  {
    itemName: 'Quick-dry Towel',
    category: 'Gear',
    affiliateUrl: 'https://amazon.com/quick-dry-towel?tag=travelravers01',
  },
];

async function applyWetTrigger(db: ReturnType<typeof useDatabase>) {
  const existing = await db
    .get<PackingItem>('packing_items')
    .query(Q.where('item_name', Q.oneOf(WET_TRIGGER_ITEMS.map((i) => i.itemName))))
    .fetch();
  const existingNames = new Set(existing.map((i) => i.itemName));

  const toAdd = WET_TRIGGER_ITEMS.filter((i) => !existingNames.has(i.itemName));
  if (toAdd.length === 0) return;

  await db.write(async () => {
    await Promise.all(
      toAdd.map((item) =>
        db.get<PackingItem>('packing_items').create((record) => {
          record.itemName = item.itemName;
          record.category = item.category;
          record.isPacked = false;
          record.weatherTrigger = 'universal' as WeatherTrigger;
          record.affiliateUrl = item.affiliateUrl;
        })
      )
    );
  });
}

// ── Festival Card ─────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  wet: 'Tropical / Wet',
  beach: 'Beach / Sun',
  none: 'General',
};

const TRIGGER_COLOURS: Record<string, string> = {
  wet: '#00C2FF',
  beach: '#FFD166',
  none: '#FF6B35',
};

function formatDateRange(startMs: number, endMs: number): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = new Date(startMs).toLocaleDateString('en-GB', opts);
  const end = new Date(endMs).toLocaleDateString('en-GB', { ...opts, year: 'numeric' });
  return `${start} – ${end}`;
}

type CardBaseProps = { festival: Festival };

const FestivalCardBase = ({ festival }: CardBaseProps) => {
  const db = useDatabase();

  const handleAttend = useCallback(async () => {
    const nextAttending = !festival.isAttending;

    await db.write(async () => {
      await festival.update((r) => {
        r.isAttending = nextAttending;
      });
    });

    if (nextAttending && festival.trigger === 'wet') {
      await applyWetTrigger(db);
    }
  }, [festival, db]);

  const triggerColour = TRIGGER_COLOURS[festival.trigger] ?? '#FF6B35';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.festivalName}>{festival.festivalName}</Text>
        <View style={[styles.triggerBadge, { borderColor: triggerColour }]}>
          <Text style={[styles.triggerText, { color: triggerColour }]}>
            {TRIGGER_LABELS[festival.trigger] ?? festival.trigger}
          </Text>
        </View>
      </View>

      <Text style={styles.country}>{festival.country}</Text>
      <Text style={styles.dates}>{formatDateRange(festival.startDate, festival.endDate)}</Text>

      <TouchableOpacity
        style={[styles.attendButton, festival.isAttending && styles.attendButtonActive]}
        onPress={handleAttend}
        activeOpacity={0.75}
      >
        <Text style={styles.attendButtonText}>
          {festival.isAttending ? '✓ Attending' : 'Attend'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const FestivalCard = withObservables(['festival'], ({ festival }: CardBaseProps) => ({
  festival: festival.observe(),
}))(FestivalCardBase);

// ── Main Screen ───────────────────────────────────────────────────────────────

type ScreenBaseProps = { festivals: Festival[] };

const FestivalsScreenBase = ({ festivals }: ScreenBaseProps) => {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;

  const pins: FestivalPin[] = festivals.map((f) => ({
    id: f.id,
    name: f.festivalName,
    lat: f.lat,
    lng: f.lng,
    trigger: f.trigger,
  }));

  return (
    <View style={[styles.container, isWide && styles.containerRow]}>
      {/* Festival List */}
      <ScrollView
        style={[styles.list, isWide && styles.listWide]}
        contentContainerStyle={styles.listContent}
      >
        <Text style={styles.sectionHeading}>2026 Season</Text>
        {festivals.map((f) => (
          <FestivalCard key={f.id} festival={f} />
        ))}
      </ScrollView>

      {/* Map Panel */}
      <View style={[styles.mapPanel, isWide && styles.mapPanelWide]}>
        <FestivalMap festivals={pins} markers={TACTICAL_MARKERS} />
      </View>
    </View>
  );
};

const EnhancedFestivalsScreen = withObservables([], () => ({
  festivals: database
    .get<Festival>('festivals')
    .query(Q.sortBy('start_date', Q.asc))
    .observe(),
}))(FestivalsScreenBase);

export default function FestivalsScreen() {
  return <EnhancedFestivalsScreen />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  containerRow: {
    flexDirection: 'row',
  },
  list: {
    flex: 1,
  },
  listWide: {
    maxWidth: 380,
    borderRightWidth: 1,
    borderRightColor: '#1E1E1E',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  sectionHeading: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  mapPanel: {
    height: 320,
    backgroundColor: '#1A1A1A',
  },
  mapPanelWide: {
    flex: 1,
    height: 'auto' as unknown as number,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  festivalName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  triggerBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  triggerText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  country: {
    color: '#888',
    fontSize: 13,
  },
  dates: {
    color: '#666',
    fontSize: 13,
  },
  attendButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  attendButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  attendButtonText: {
    color: '#FF6B35',
    fontWeight: '700',
    fontSize: 14,
  },
});
