import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Festival } from '../models/Festival';
import { TacticalFestivalCard } from './TacticalFestivalCard';
import { getTacticalZone, TacticalZoneType } from '../logic/GeofenceEngine';
import { COLORS, TYPOGRAPHY } from '../constants/Theme';

// ── Zone Alert Config ─────────────────────────────────────────────────────────

const ZONE_CONFIG: Record<TacticalZoneType, { color: string; message: string }> = {
  BLACKOUT_ZONE: {
    color: '#FF00FF',
    message: '[!] SIGNAL SHIELD DETECTED: AUTO-CACHING SQUAD DATA',
  },
  CROWD_DENSITY_HIGH: {
    color: '#FF6B35',
    message: '[!] CROWD DENSITY WARNING: ESTABLISH MEETING POINT NOW',
  },
};

// ── Zone Alert Banner ─────────────────────────────────────────────────────────

function ZoneAlertBanner({ zoneType }: { zoneType: TacticalZoneType }) {
  const { color, message } = ZONE_CONFIG[zoneType];
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.2, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,   // infinite
      true, // reverse on each iteration
    );
  }, [opacity]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.alertBanner, {
      backgroundColor: `${color}1A`, // 10% opacity fill
      borderBottomColor: color,
      shadowColor: color,
    }]}>
      <Animated.Text style={[styles.alertText, { color }, animatedTextStyle]}>
        {message}
      </Animated.Text>
    </View>
  );
}

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
  const [activeZone, setActiveZone] = useState<TacticalZoneType | null>(null);

  // ── Passive Radar — recomputes every 10m of movement ─────────────────────
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
        },
        ({ coords }) => {
          setActiveZone(getTacticalZone(coords.latitude, coords.longitude));
        },
      );
    })();

    return () => { subscription?.remove(); };
  }, []);

  const handleCardPress = useCallback(
    (id: string) => {
      router.push({ pathname: '/festival/[id]', params: { id } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Festival }) => (
      <TacticalFestivalCard
        festival={item}
        onPress={() => handleCardPress(item.id)}
      />
    ),
    [handleCardPress],
  );

  const keyExtractor = useCallback((item: Festival) => item.id, []);

  return (
    <View style={styles.container}>
      <SystemStatusHeader />
      {activeZone && <ZoneAlertBanner zoneType={activeZone} />}
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

  // Status bar
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

  // Alert banner
  alertBanner: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  alertText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  // HUD header
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

  // List
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  separator: {
    height: 10,
  },
});
