import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Native stub — shows the code prominently until react-native-svg is added.
// The web version (.web.tsx) renders a real QR code via the qrcode library.
export default function QRDisplay({ value, size = 180 }: { value: string; size?: number }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={styles.code}>{value}</Text>
      <Text style={styles.hint}>Enter this code{'\n'}on your squad's devices</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF00FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  code: {
    color: '#FF00FF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 8,
  },
  hint: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
