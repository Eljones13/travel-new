// SquadPulse.tsx — SneakerNet QR Generator
// Compresses the member's own GPS position into a scannable QR.
// Offline-first: no network needed, expo-location reads hardware GPS directly.
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import LZString from 'lz-string';
import * as Location from 'expo-location';

import { SquadSession } from '../models/SquadSession';
import { COLORS, CYAN_GLOW, GLASS_STYLE, TYPOGRAPHY } from '../constants/Theme';

// ── Payload type ──────────────────────────────────────────────────────────────
// Short keys deliberately chosen to keep JSON small before compression.
export type SneakerPayload = {
  v: 1;
  c: string;   // squadCode
  m: {
    n: string; // displayName
    a: number; // lat
    o: number; // lng
    t: number; // timestamp (ms)
    s: boolean;// SOS flag
  }[];
};

type Props = {
  session: SquadSession;
  isSOS: boolean;
};

type LocationState =
  | { status: 'idle' }
  | { status: 'acquiring' }
  | { status: 'ready'; qr: string; lockedAt: number }
  | { status: 'error'; message: string };

export default function SquadPulse({ session, isSOS }: Props) {
  const [loc, setLoc] = useState<LocationState>({ status: 'idle' });

  const buildQR = useCallback(async () => {
    setLoc({ status: 'acquiring' });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoc({ status: 'error', message: 'LOCATION DENIED — ENABLE IN SETTINGS' });
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const payload: SneakerPayload = {
        v: 1,
        c: session.squadCode,
        m: [{
          n: session.displayName,
          a: position.coords.latitude,
          o: position.coords.longitude,
          t: Date.now(),
          s: isSOS,
        }],
      };
      const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
      setLoc({ status: 'ready', qr: compressed, lockedAt: Date.now() });
    } catch {
      setLoc({ status: 'error', message: 'GPS UNAVAILABLE' });
    }
  }, [session.squadCode, session.displayName, isSOS]);

  // Build on mount and whenever SOS status changes
  useEffect(() => {
    buildQR();
  }, [buildQR]);

  return (
    <View style={[styles.container, GLASS_STYLE, CYAN_GLOW]}>
      <Text style={styles.label}>SQUAD PULSE — SNEAKERNET</Text>

      <View style={styles.qrFrame}>
        {loc.status === 'acquiring' || loc.status === 'idle' ? (
          <View style={styles.placeholder}>
            <Text style={styles.acquiringText}>ACQUIRING POSITION...</Text>
          </View>
        ) : loc.status === 'error' ? (
          <View style={styles.placeholder}>
            <Text style={styles.errorText}>{loc.message}</Text>
          </View>
        ) : (
          <QRCode
            value={loc.qr}
            size={220}
            color={COLORS.cyan}
            backgroundColor={COLORS.background}
          />
        )}
      </View>

      <View style={styles.meta}>
        <View style={styles.metaLeft}>
          <Text style={styles.memberName}>{session.displayName}</Text>
          {loc.status === 'ready' && (
            <Text style={styles.timestamp}>
              LOCKED{' '}
              {new Date(loc.lockedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
        {isSOS && (
          <View style={styles.sosBadge}>
            <Text style={styles.sosText}>⚠ SOS</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={buildQR}
        disabled={loc.status === 'acquiring'}
        activeOpacity={0.7}
      >
        <Text style={[styles.refreshText, loc.status === 'acquiring' && styles.refreshDisabled]}>
          {loc.status === 'acquiring' ? 'ACQUIRING...' : 'REFRESH POSITION'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    alignItems: 'center',
  },
  label: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.textSecondary,
    alignSelf: 'flex-start',
  },
  qrFrame: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  acquiringText: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.orange,
    textAlign: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  metaLeft: { gap: 2 },
  memberName: {
    ...TYPOGRAPHY.monoMd,
    color: COLORS.cyan,
  },
  timestamp: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.textSecondary,
  },
  sosBadge: {
    backgroundColor: COLORS.orange,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sosText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  refreshBtn: {
    borderWidth: 0.5,
    borderColor: COLORS.glassBorder,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  refreshText: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.cyan,
  },
  refreshDisabled: {
    color: COLORS.textSecondary,
  },
});
