import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TacticalMarker } from '../constants/tacticalMarkers';
import { COLORS, TYPOGRAPHY } from '../constants/Theme';

export type FestivalPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  trigger: string;
};

export type SquadPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type { TacticalMarker };

type Props = {
  festivals: FestivalPin[];
  markers?: TacticalMarker[];
  squadPins?: SquadPin[];
};

// Native stub — map renders on web only (react-leaflet).
// iOS/Android will use Apple Maps in a future iteration.
export default function FestivalMap({ festivals, markers = [], squadPins = [] }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>◈ MAP OFFLINE</Text>
      <Text style={styles.label}>Full map available on web</Text>
      {festivals.map((f) => (
        <Text key={f.id} style={styles.pin}>
          {f.name}{'  '}{f.lat.toFixed(4)}, {f.lng.toFixed(4)}
        </Text>
      ))}
      {squadPins.map((s) => (
        <Text key={s.id} style={styles.squadPin}>
          ● {s.name}{'  '}{s.lat.toFixed(4)}, {s.lng.toFixed(4)}
        </Text>
      ))}
      {markers.length > 0 && (
        <Text style={styles.markerCount}>{markers.length} SAFETY POIs LOADED</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 6,
  },
  header: {
    ...TYPOGRAPHY.monoMd,
    color: COLORS.cyan,
    marginBottom: 4,
  },
  label: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  pin: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.cyan,
  },
  squadPin: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.magenta,
  },
  markerCount: {
    ...TYPOGRAPHY.monoSm,
    color: COLORS.textSecondary,
    marginTop: 8,
    opacity: 0.6,
  },
});
