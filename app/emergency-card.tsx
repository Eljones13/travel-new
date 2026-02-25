import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDatabase } from '@nozbe/watermelondb/react';
import { EmergencyCard } from '../src/models/EmergencyCard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CardData {
  ownerName: string;
  bloodType: string;
  iceName: string;
  icePhone: string;
  medicalNotes: string;
}

const EMPTY: CardData = {
  ownerName: '',
  bloodType: '',
  iceName: '',
  icePhone: '',
  medicalNotes: '',
};

// ── Field row ─────────────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={card.fieldRow}>
      <Text style={card.fieldLabel}>{label}</Text>
      <Text style={card.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

// ── Screenshot Card ───────────────────────────────────────────────────────────

function ScreenshotCard({ data }: { data: CardData }) {
  return (
    <View style={card.container}>
      <View style={card.header}>
        <Text style={card.headerIcon}>🆘</Text>
        <View>
          <Text style={card.headerTitle}>EMERGENCY MEDICAL CARD</Text>
          <Text style={card.headerSub}>Show this card to medics or emergency services</Text>
        </View>
      </View>
      <View style={card.divider} />
      <FieldRow label="NAME" value={data.ownerName} />
      <FieldRow label="BLOOD TYPE" value={data.bloodType} />
      <View style={card.divider} />
      <Text style={card.sectionTitle}>IN CASE OF EMERGENCY</Text>
      <FieldRow label="CONTACT" value={data.iceName} />
      <FieldRow label="PHONE" value={data.icePhone} />
      <View style={card.divider} />
      <Text style={card.sectionTitle}>MEDICAL NOTES</Text>
      <Text style={card.notes}>{data.medicalNotes || 'None'}</Text>
      <View style={card.divider} />
      <Text style={card.footer}>🌐 EU EMERGENCY: 112  ·  UK: 999  ·  US: 911</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function EmergencyCardScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [data, setData] = useState<CardData>(EMPTY);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Load existing record ──────────────────────────────────────────────────
  useEffect(() => {
    db.get<EmergencyCard>('emergency_cards').query().fetch().then((records) => {
      if (records.length > 0) {
        const r = records[0];
        setRecordId(r.id);
        setData({
          ownerName: r.ownerName,
          bloodType: r.bloodType,
          iceName: r.iceName,
          icePhone: r.icePhone,
          medicalNotes: r.medicalNotes,
        });
      }
    });
  }, [db]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    await db.write(async () => {
      if (recordId) {
        const record = await db.get<EmergencyCard>('emergency_cards').find(recordId);
        await record.update((r) => {
          r.ownerName = data.ownerName;
          r.bloodType = data.bloodType;
          r.iceName = data.iceName;
          r.icePhone = data.icePhone;
          r.medicalNotes = data.medicalNotes;
        });
      } else {
        const created = await db.get<EmergencyCard>('emergency_cards').create((r) => {
          r.ownerName = data.ownerName;
          r.bloodType = data.bloodType;
          r.iceName = data.iceName;
          r.icePhone = data.icePhone;
          r.medicalNotes = data.medicalNotes;
        });
        setRecordId(created.id);
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [db, data, recordId]);

  const set = (key: keyof CardData) => (val: string) =>
    setData((prev) => ({ ...prev, [key]: val }));

  // ── Screenshot Mode ───────────────────────────────────────────────────────
  if (screenshotMode) {
    return (
      <View style={styles.screenshotBg}>
        <ScreenshotCard data={data} />
        <TouchableOpacity
          style={styles.exitScreenshot}
          onPress={() => setScreenshotMode(false)}
        >
          <Text style={styles.exitScreenshotText}>✕ EXIT SCREENSHOT MODE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Edit Mode ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EMERGENCY CARD</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{saved ? '✓ SAVED' : 'SAVE'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>IDENTITY</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#999"
          value={data.ownerName}
          onChangeText={set('ownerName')}
        />
        <TextInput
          style={styles.input}
          placeholder="Blood Type (e.g. O+)"
          placeholderTextColor="#999"
          value={data.bloodType}
          onChangeText={set('bloodType')}
          autoCapitalize="characters"
        />

        <Text style={styles.sectionLabel}>IN CASE OF EMERGENCY (ICE)</Text>
        <TextInput
          style={styles.input}
          placeholder="Contact Name"
          placeholderTextColor="#999"
          value={data.iceName}
          onChangeText={set('iceName')}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact Phone"
          placeholderTextColor="#999"
          value={data.icePhone}
          onChangeText={set('icePhone')}
          keyboardType="phone-pad"
        />

        <Text style={styles.sectionLabel}>MEDICAL NOTES</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Allergies, medications, conditions..."
          placeholderTextColor="#999"
          value={data.medicalNotes}
          onChangeText={set('medicalNotes')}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Screenshot Mode button */}
        <TouchableOpacity
          style={styles.screenshotBtn}
          onPress={() => setScreenshotMode(true)}
        >
          <Text style={styles.screenshotBtnText}>📸  SCREENSHOT MODE</Text>
          <Text style={styles.screenshotBtnSub}>Shows card full-screen to show medics</Text>
        </TouchableOpacity>

        {/* Preview */}
        <Text style={styles.sectionLabel}>PREVIEW</Text>
        <ScreenshotCard data={data} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Card styles (high-contrast black/white) ───────────────────────────────────

const card = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 11,
    color: '#444444',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#000000',
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444444',
    letterSpacing: 1,
    width: 100,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    flex: 1,
    textAlign: 'right',
  },
  notes: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  footer: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
});

// ── Screen styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    marginRight: 12,
  },
  backText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#00F2FF',
    letterSpacing: 1,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  saveBtn: {
    backgroundColor: '#FF3E3E',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  form: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginTop: 12,
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'SpaceMono',
  },
  inputMulti: {
    minHeight: 100,
    paddingTop: 12,
  },
  screenshotBtn: {
    backgroundColor: '#FF3E3E',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  screenshotBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  screenshotBtnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  screenshotBg: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    justifyContent: 'center',
    gap: 20,
  },
  exitScreenshot: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  exitScreenshotText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 1,
  },
});
