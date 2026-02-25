// Web stub — react-native-vision-camera is a native-only module.
// Metro automatically serves this file on web instead of SquadScanner.tsx.
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/Theme';

type Props = {
  squadCode: string;
  onClose: () => void;
};

export default function SquadScanner({ onClose }: Props) {
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.box}>
          <Text style={styles.icon}>📵</Text>
          <Text style={styles.title}>SCANNER NOT AVAILABLE ON WEB</Text>
          <Text style={styles.body}>
            QR scanning requires the native app.{'\n'}
            Use the Android or iOS build to sync squad data via SneakerNet.
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕ CLOSE</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 32,
  },
  box: {
    borderWidth: 0.5,
    borderColor: 'rgba(0,242,255,0.3)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 360,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    ...TYPOGRAPHY.monoMd,
    color: COLORS.cyan,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  closeBtn: {
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
