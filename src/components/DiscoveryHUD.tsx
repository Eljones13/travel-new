import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Festival } from '../models/Festival';
import { TacticalFestivalCard } from './TacticalFestivalCard';
import { COLORS, TYPOGRAPHY } from '../constants/Theme';

// ── System Status Header ──────────────────────────────────────────────────────

function SystemStatusHeader() {
  return (
    <View style={styles.statusBar}>
      <View style={styles.statusDot} />
      <Text style={[styles.statusText, TYPOGRAPHY.monoSm]}>
        SQUAD: ACTIVE | OFFLINE STORAGE: 100%
      </Text>
      <View style={[styles.statusDot, styles.statusDotRight]} />
    </View>
  );
}

// ── HUD Header ────────────────────────────────────────────────────────────────

function HUDHeader({ count }: { count: number }) {
  return (
    <View style={styles.hudHeader}>
      <Text style={styles.hudTitle}>DISCOVERY HUD</Text>
      <Text style={[styles.hudSubtitle, TYPOGRAPHY.monoSm]}>
        {count} FESTIVALS · 2026 SEASON
      </Text>
    </View>
  );
}

// ── Main List ─────────────────────────────────────────────────────────────────

type BaseProps = { festivals: Festival[] };

function DiscoveryHUDBase({ festivals }: BaseProps) {
  const router = useRouter();

  const handleCardPress = useCallback((id: string) => {
    router.push({ pathname: '/festival/[id]', params: { id } });
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Festival }) => (
    <TacticalFestivalCard
      festival={item}
      onPress={() => handleCardPress(item.id)}
    />
  ), [handleCardPress]);

  const keyExtractor = useCallback((item: Festival) => item.id, []);

  return (
    <View style={styles.container}>
      <SystemStatusHeader />
      <FlatList
        data={festivals}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={<HUDHeader count={festivals.length} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      />
    </View>
  );
}

// ── Observable wrapper ────────────────────────────────────────────────────────

const DiscoveryHUDEnhanced = withObservables([], () => ({
  festivals: database
    .get<Festival>('festivals')
    .query(Q.sortBy('start_date', Q.asc))
    .observe(),
}))(DiscoveryHUDBase);

export function DiscoveryHUD() {
  return <DiscoveryHUDEnhanced />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 242, 255, 0.06)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 242, 255, 0.25)',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusDotRight: {
    marginLeft: 'auto',
  },
  statusText: {
    color: COLORS.cyan,
    fontSize: 10,
    letterSpacing: 1.5,
    flex: 1,
  },
  hudHeader: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
  },
  hudTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 3,
  },
  hudSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    letterSpacing: 2,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  separator: {
    height: 10,
  },
});
