import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Festival } from '../models/Festival';
import { TacticalFestivalCard } from './TacticalFestivalCard';
import { checkZoneProximity, ZoneAlert } from '../logic/GeofenceEngine';
import { COLORS, TYPOGRAPHY } from '../constants/Theme';

// ── System Alert Banner ───────────────────────────────────────────────────────

function SystemAlertBanner({ alert }: { alert: ZoneAlert }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.25,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.alertBanner, { opacity: pulseAnim }]}>
      <View style={styles.alertInner}>
        <Text style={styles.alertZone}>
          ⚡ {alert.zone.name.toUpperCase()} · {alert.zone.festivalName.toUpperCase()}
        </Text>
        <Text style={styles.alertMessage}>{alert.tacticalMessage}</Text>
        <Text style={styles.alertDist}>{alert.distanceMeters}m FROM ZONE CENTRE</Text>
      </View>
    </Animated.View>
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
  const [activeAlert, setActiveAlert] = useState<ZoneAlert | null>(null);

  // ── Passive Radar — watches location, fires geofence checks every 10m ──────
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10, // only recompute every 10m moved
        },
        ({ coords }) => {
          setActiveAlert(checkZoneProximity(coords.latitude, coords.longitude));
        },
      );
    })();

    return () => {
      subscription?.remove();
    };
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
      {activeAlert && <SystemAlertBanner alert={activeAlert} />}
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

  // System Status
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

  // Alert Banner
  alertBanner: {
    backgroundColor: 'rgba(255, 0, 255, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.magenta,
    // iOS glow
    shadowColor: COLORS.magenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },
  alertInner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 2,
  },
  alertZone: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: COLORS.magenta,
    letterSpacing: 2,
    fontWeight: '700',
  },
  alertMessage: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: COLORS.magenta,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  alertDist: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255, 0, 255, 0.6)',
    letterSpacing: 1,
  },

  // HUD Header
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
