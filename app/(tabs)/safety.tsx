import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:          '#0D0D0D',
  surface:     '#111827',
  border:      '#1E1E1E',
  neonGreen:   '#00FF9F',
  neonCyan:    '#00D1FF',
  neonPink:    '#FF2D78',
  neonAmber:   '#FFCC00',
  textPrimary: '#FFFFFF',
  textDim:     '#888888',
};

// ── Static content ─────────────────────────────────────────────────────────────
// All data is bundled — zero network, instant offline access.

type RightsCard = {
  kind: 'rights';
  title: string;
  bullets: string[];
  accent?: string; // defaults to neonGreen when absent
};

type TranslationPhrase = {
  english: string;
  foreign: string;
  pronunciation?: string;
};

type TranslationCard = {
  kind: 'translation';
  title: string;
  phrases: TranslationPhrase[];
};

type SafetyCard = RightsCard | TranslationCard;

type Section = {
  header: string;
  cards: SafetyCard[];
};

const SECTIONS: Section[] = [
  {
    header: '🇬🇧  United Kingdom',
    cards: [
      {
        kind: 'rights',
        title: 'Stop & Search Rights',
        bullets: [
          'You are not required to provide personal details unless being arrested. Ask: "Am I being detained?" — if No, you are free to leave.',
          'Officers MUST state: the law used, what they suspect, and their name & badge number.',
          'You do NOT have to answer questions — you have the right to remain silent.',
          'They CANNOT search your phone without a separate warrant.',
          'You CAN record the stop on your phone — this is legal.',
          'Demand a written record of the search — you are legally entitled to one.',
          'S.60 orders (no suspicion needed) must be publicly displayed at the festival entrance.',
        ],
      },
      {
        kind: 'rights',
        title: 'Welfare Tent Safety',
        bullets: [
          'Staff are bound by confidentiality — they are NOT police.',
          'Always tell them exactly what you took and when — it can save your life.',
          'They will only involve emergency services if your life is at immediate risk.',
          'No shame, no judgment — getting help is always the right call.',
          'FRANK Helpline: 0300 123 6600 (free, confidential, 24/7 drug advice).',
        ],
      },
    ],
  },
  {
    header: '🇪🇸  Spain / España',
    cards: [
      {
        kind: 'translation',
        title: 'Medical Phrases — España',
        phrases: [
          {
            english: 'I need a doctor',
            foreign: 'Necesito un médico',
            pronunciation: 'neh-seh-SEE-toh oon MEH-dee-koh',
          },
          {
            english: 'I am dehydrated',
            foreign: 'Estoy deshidratado/a',
          },
          {
            english: 'Call an ambulance',
            foreign: 'Llame a una ambulancia',
            pronunciation: 'YAH-meh ah OO-nah ahm-boo-LAHN-see-ah',
          },
          {
            english: 'I am allergic to ___',
            foreign: 'Soy alérgico/a a ___',
          },
          {
            english: 'I need water',
            foreign: 'Necesito agua',
          },
        ],
      },
    ],
  },
  {
    header: '🇭🇷  Croatia / Hrvatska',
    cards: [
      {
        kind: 'translation',
        title: 'Medical Phrases — Hrvatska',
        phrases: [
          {
            english: 'I have severe heatstroke',
            foreign: 'Imam toplinski udar',
            pronunciation: 'EE-mahm TOP-lin-skee OO-dar',
          },
          {
            english: 'Where is the medical tent?',
            foreign: 'Gdje je medicinski šator?',
            pronunciation: 'G-dyeh yeh meh-DEET-sin-skee SHA-tor',
          },
          {
            english: 'I need a doctor',
            foreign: 'Trebam liječnika',
            pronunciation: 'TREH-bahm lee-EH-chnee-kah',
          },
          {
            english: 'I am dehydrated',
            foreign: 'Dehidriran/a sam',
            pronunciation: 'deh-hee-DREE-rahn sahm',
          },
          {
            english: 'Call an ambulance',
            foreign: 'Pozovite hitnu pomoć',
            pronunciation: 'poh-ZOH-vee-teh HIT-noo POH-moch',
          },
          {
            english: 'I am having an allergic reaction',
            foreign: 'Imam alergijsku reakciju',
          },
        ],
      },
    ],
  },
  {
    header: '🇭🇺  Hungary / Magyarország — Sziget',
    cards: [
      {
        kind: 'rights',
        title: 'Welfare at Sziget',
        accent: '#FFCC00', // neonAmber — elevated caution for strict drug laws
        bullets: [
          'Drug laws in Hungary are strict — possession carries serious criminal penalties.',
          'If a friend is unwell, go immediately to the "Check-In" or "Help" tent on site.',
          'These tents prioritise your health over police intervention — be honest about what was taken.',
          'Sziget\'s welfare staff are trained in harm reduction; they will not judge you.',
          'Getting help quickly is always the right decision — do not wait.',
        ],
      },
    ],
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function WarningBanner() {
  return (
    <View style={styles.warningBanner}>
      <Text style={styles.warningIcon}>⚠</Text>
      <Text style={styles.warningText}>
        Reference only — always call{' '}
        <Text style={styles.warningEmphasis}>112</Text>
        {' '}in a life-threatening emergency.
      </Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function RightsCardView({ card }: { card: RightsCard }) {
  const accent = card.accent ?? C.neonGreen;
  return (
    <View style={[styles.card, styles.cardRights, { borderLeftColor: accent }]}>
      <Text style={[styles.cardTitle, { color: accent }]}>{card.title}</Text>
      {card.bullets.map((bullet, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: accent }]}>•</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  );
}

function TranslationCardView({ card }: { card: TranslationCard }) {
  return (
    <View style={[styles.card, styles.cardTranslation]}>
      <Text style={[styles.cardTitle, { color: C.neonPink }]}>{card.title}</Text>
      {card.phrases.map((phrase, i) => (
        <View
          key={i}
          style={[
            styles.phraseRow,
            i < card.phrases.length - 1 && styles.phraseRowBorder,
          ]}
        >
          <Text style={styles.phraseEnglish}>{phrase.english}</Text>
          {/* Large — legible enough to show directly to a medic */}
          <Text selectable style={styles.phraseForein}>{phrase.foreign}</Text>
          {phrase.pronunciation ? (
            <Text style={styles.phrasePronunciation}>{phrase.pronunciation}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function renderCard(card: SafetyCard, index: number) {
  if (card.kind === 'rights') {
    return <RightsCardView key={index} card={card} />;
  }
  return <TranslationCardView key={index} card={card} />;
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function SafetyScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      <WarningBanner />
      {SECTIONS.map((section, si) => (
        <View key={si}>
          <SectionHeader title={section.header} />
          {section.cards.map((card, ci) => renderCard(card, ci))}
        </View>
      ))}
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 4,
  },

  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1A1500',
    borderWidth: 1,
    borderColor: C.neonAmber,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  warningIcon: {
    fontSize: 18,
    color: C.neonAmber,
    lineHeight: 22,
  },
  warningText: {
    flex: 1,
    color: C.neonAmber,
    fontSize: 13,
    lineHeight: 20,
  },
  warningEmphasis: {
    fontWeight: '800',
    fontSize: 15,
  },

  // Section header
  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
    paddingLeft: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.neonCyan,
    paddingVertical: 2,
  },
  sectionHeaderText: {
    color: C.neonCyan,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Card base
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  cardRights: {
    borderLeftWidth: 3,
    borderLeftColor: C.neonGreen,
  },
  cardTranslation: {
    borderLeftWidth: 3,
    borderLeftColor: C.neonPink,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  // Rights bullets
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 22,
    width: 12,
  },
  bulletText: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },

  // Translation phrases
  phraseRow: {
    paddingVertical: 12,
  },
  phraseRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  phraseEnglish: {
    color: C.textDim,
    fontSize: 13,
    marginBottom: 4,
  },
  phraseForein: {
    color: C.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  phrasePronunciation: {
    color: C.textDim,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 3,
  },
});
