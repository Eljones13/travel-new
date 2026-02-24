import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TacticalMarker } from '../constants/tacticalMarkers';

export type FestivalPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  trigger: string;
};

export type { TacticalMarker };

type Props = { festivals: FestivalPin[]; markers?: TacticalMarker[] };

// Native stub — map renders on web only (react-leaflet).
// iOS/Android will use Apple Maps in a future iteration.
export default function FestivalMap({ festivals, markers = [] }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Map available on web</Text>
      {festivals.map((f) => (
        <Text key={f.id} style={styles.pin}>
          {f.name} — {f.lat.toFixed(2)}, {f.lng.toFixed(2)}
        </Text>
      ))}
      {markers.length > 0 && (
        <Text style={styles.markerCount}>{markers.length} safety POIs</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  label: { color: '#666', fontSize: 14, marginBottom: 12 },
  pin: { color: '#FF6B35', fontSize: 13, marginTop: 6 },
  markerCount: { color: '#FF6B35', fontSize: 11, marginTop: 12, opacity: 0.6 },
});
