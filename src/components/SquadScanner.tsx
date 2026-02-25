// SquadScanner.tsx — SneakerNet QR Reader
// Scans a SquadPulse QR and upserts member location into local WatermelonDB.
// No network required. All data stays on-device.
import React, { useCallback, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import LZString from 'lz-string';
import { Q } from '@nozbe/watermelondb';

import { database } from '../db';
import { SquadMember } from '../models/SquadMember';
import { COLORS, GLASS_STYLE, TYPOGRAPHY } from '../constants/Theme';
import { SneakerPayload } from './SquadPulse';

type SyncResult = { name: string; isSOS: boolean } | null;

type Props = {
  squadCode: string; // Only accept QRs for this squad
  onClose: () => void;
};

export default function SquadScanner({ squadCode, onClose }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const lastScannedRef = useRef<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult>(null);

  // ── Upsert member location into WatermelonDB ────────────────────────────────
  const upsertMembers = useCallback(async (payload: SneakerPayload) => {
    await database.write(async () => {
      for (const m of payload.m) {
        const existing = await database
          .get<SquadMember>('squad_members')
          .query(
            Q.where('squad_code', payload.c),
            Q.where('display_name', m.n),
          )
          .fetch();

        if (existing.length > 0) {
          await existing[0].update((r) => {
            r.lat = m.a;
            r.lng = m.o;
            r.lastSeenAt = m.t;
            r.isSos = m.s;
          });
        } else {
          await database.get<SquadMember>('squad_members').create((r) => {
            r.squadCode = payload.c;
            r.displayName = m.n;
            r.lat = m.a;
            r.lng = m.o;
            r.lastSeenAt = m.t;
            r.isSos = m.s;
          });
        }
      }
    });
  }, []);

  // ── QR code handler ─────────────────────────────────────────────────────────
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const raw = codes[0]?.value;
      if (!raw || raw === lastScannedRef.current) return;

      // Debounce: ignore the same QR for 4 seconds
      lastScannedRef.current = raw;
      setTimeout(() => { lastScannedRef.current = null; }, 4000);

      try {
        const json = LZString.decompressFromEncodedURIComponent(raw);
        if (!json) return;
        const payload: SneakerPayload = JSON.parse(json);

        // Validate: must be v1 and match our squad code
        if (payload.v !== 1 || payload.c !== squadCode) return;

        upsertMembers(payload).then(() => {
          const first = payload.m[0];
          setSyncResult({ name: first.n, isSOS: first.s });
          // Auto-dismiss the flash after 2.5s
          setTimeout(() => setSyncResult(null), 2500);
        });
      } catch {
        // Malformed QR — ignore silently
      }
    },
  });

  // ── Permission gate ─────────────────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <Modal animationType="slide" onRequestClose={onClose}>
        <View style={styles.permissionScreen}>
          <Text style={styles.permissionTitle}>CAMERA ACCESS REQUIRED</Text>
          <Text style={styles.permissionBody}>
            Squad Pulse needs your camera to scan crew QR codes.
          </Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <Text style={styles.grantBtnText}>GRANT PERMISSION</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!device) {
    return (
      <Modal animationType="slide" onRequestClose={onClose}>
        <View style={styles.permissionScreen}>
          <Text style={styles.permissionTitle}>NO CAMERA DETECTED</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={styles.scannerScreen}>
        {/* Live camera feed */}
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          codeScanner={codeScanner}
        />

        {/* HUD overlay */}
        <View style={styles.hud}>
          <Text style={styles.hudTitle}>SCANNING CREW QR</Text>
          <Text style={styles.hudSub}>Squad: {squadCode}</Text>
        </View>

        {/* Viewfinder bracket */}
        <View style={styles.viewfinderWrapper} pointerEvents="none">
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Sync result flash */}
        {syncResult && (
          <View style={[styles.syncFlash, GLASS_STYLE]}>
            {syncResult.isSOS ? (
              <Text style={styles.sosAlert}>⚠ SOS — {syncResult.name}</Text>
            ) : (
              <Text style={styles.syncText}>SYNCED — {syncResult.name}</Text>
            )}
          </View>
        )}

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕ CLOSE</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICK = 3;

const styles = StyleSheet.create({
  permissionScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    ...TYPOGRAPHY.monoLg,
    color: COLORS.cyan,
    textAlign: 'center',
  },
  permissionBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  grantBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  grantBtnText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  scannerScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  hud: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  hudTitle: {
    ...TYPOGRAPHY.monoLg,
    color: COLORS.cyan,
  },
  hudSub: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.textSecondary,
  },
  viewfinderWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: COLORS.cyan,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
  },
  syncFlash: {
    position: 'absolute',
    bottom: 120,
    left: 32,
    right: 32,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderColor: COLORS.glassBorder,
    borderWidth: 0.5,
  },
  syncText: {
    ...TYPOGRAPHY.monoMd,
    color: COLORS.cyan,
  },
  sosAlert: {
    ...TYPOGRAPHY.monoMd,
    color: COLORS.orange,
    fontWeight: '900',
  },
  closeBtn: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.glassBorder,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  closeBtnText: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.textSecondary,
  },
});
