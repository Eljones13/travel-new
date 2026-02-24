/**
 * Seeded S2O Songkran 2026 simulated lineup.
 * festival_id matches festival_name from seeds.ts so the schedule screen
 * can filter by festival without a DB join.
 *
 * Stage colors are the neon accent used in chips + live highlights.
 *
 * spotify_preview_url: Replace placeholder values with real 30-second preview
 * URLs from the Spotify Web API (GET /tracks/{id}). Previews work without auth.
 */

import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { Stage } from '../models/Stage';
import { Performance } from '../models/Performance';

const t = (iso: string) => new Date(iso).getTime();

// Use Spotify CDN format. Replace with real hashes from the Spotify API.
const preview = (slug: string) =>
  `https://p.scdn.co/mp3-preview/placeholder_${slug}`;

type PerfSeed = {
  artist: string;
  start: string;
  end: string;
  genre: string;
  spotifyPreviewUrl: string;
};

type StageSeed = {
  name: string;
  color: string;
  performances: PerfSeed[];
};

const S2O_STAGES: StageSeed[] = [
  {
    name: 'Main Stage (The Splash Zone)',
    color: '#FF00FF',
    performances: [
      {
        artist: 'Opening Ceremony',
        start: '2026-04-12T12:00:00+07:00',
        end: '2026-04-12T14:00:00+07:00',
        genre: 'Festival Opening',
        spotifyPreviewUrl: '',
      },
      {
        artist: 'Local Crew',
        start: '2026-04-12T14:00:00+07:00',
        end: '2026-04-12T16:00:00+07:00',
        genre: 'Thai EDM',
        spotifyPreviewUrl: '',
      },
      {
        artist: 'Afrojack',
        start: '2026-04-12T16:00:00+07:00',
        end: '2026-04-12T18:00:00+07:00',
        genre: 'Big Room EDM',
        spotifyPreviewUrl: preview('afrojack'),
      },
      {
        artist: 'Timmy Trumpet',
        start: '2026-04-12T18:00:00+07:00',
        end: '2026-04-12T20:00:00+07:00',
        genre: 'Festival Trap',
        spotifyPreviewUrl: preview('timmy_trumpet'),
      },
      {
        artist: 'Martin Garrix',
        start: '2026-04-12T20:00:00+07:00',
        end: '2026-04-12T22:00:00+07:00',
        genre: 'Progressive House',
        spotifyPreviewUrl: preview('martin_garrix'),
      },
      {
        artist: 'DJ Snake',
        start: '2026-04-12T22:00:00+07:00',
        end: '2026-04-13T00:00:00+07:00',
        genre: 'Future Bass / Trap',
        spotifyPreviewUrl: preview('dj_snake'),
      },
    ],
  },
  {
    name: 'Water Dome',
    color: '#00C8FF',
    performances: [
      {
        artist: 'Morning Warm-Up',
        start: '2026-04-12T12:00:00+07:00',
        end: '2026-04-12T14:00:00+07:00',
        genre: 'Warm-Up Techno',
        spotifyPreviewUrl: '',
      },
      {
        artist: 'Bamboo Rising',
        start: '2026-04-12T14:00:00+07:00',
        end: '2026-04-12T16:00:00+07:00',
        genre: 'Tech House',
        spotifyPreviewUrl: preview('bamboo_rising'),
      },
      {
        artist: 'Fisher',
        start: '2026-04-12T16:00:00+07:00',
        end: '2026-04-12T18:00:00+07:00',
        genre: 'Tech House',
        spotifyPreviewUrl: preview('fisher'),
      },
      {
        artist: 'Chris Lake',
        start: '2026-04-12T18:00:00+07:00',
        end: '2026-04-12T20:00:00+07:00',
        genre: 'Tech House',
        spotifyPreviewUrl: preview('chris_lake'),
      },
      {
        artist: 'Charlotte de Witte',
        start: '2026-04-12T20:00:00+07:00',
        end: '2026-04-12T22:00:00+07:00',
        genre: 'Dark Techno',
        spotifyPreviewUrl: preview('charlotte_de_witte'),
      },
      {
        artist: 'Nina Kraviz',
        start: '2026-04-12T22:00:00+07:00',
        end: '2026-04-13T00:00:00+07:00',
        genre: 'Techno',
        spotifyPreviewUrl: preview('nina_kraviz'),
      },
    ],
  },
  {
    name: 'The Oasis',
    color: '#FFD166',
    performances: [
      {
        artist: 'Morning Chill Set',
        start: '2026-04-12T12:00:00+07:00',
        end: '2026-04-12T14:00:00+07:00',
        genre: 'Ambient',
        spotifyPreviewUrl: '',
      },
      {
        artist: 'Thai Folk Fusion',
        start: '2026-04-12T14:00:00+07:00',
        end: '2026-04-12T16:00:00+07:00',
        genre: 'World Music',
        spotifyPreviewUrl: preview('thai_folk_fusion'),
      },
      {
        artist: 'Sunset Chill',
        start: '2026-04-12T16:00:00+07:00',
        end: '2026-04-12T18:00:00+07:00',
        genre: 'Tropical House',
        spotifyPreviewUrl: preview('sunset_chill'),
      },
      {
        artist: 'Lounge DJ Set',
        start: '2026-04-12T18:00:00+07:00',
        end: '2026-04-12T20:00:00+07:00',
        genre: 'Deep House',
        spotifyPreviewUrl: preview('lounge_dj'),
      },
      {
        artist: 'Ambient House',
        start: '2026-04-12T20:00:00+07:00',
        end: '2026-04-12T22:00:00+07:00',
        genre: 'Ambient House',
        spotifyPreviewUrl: preview('ambient_house'),
      },
    ],
  },
];

export async function seedSchedule(db: Database): Promise<void> {
  const existing = await db
    .get<Stage>('stages')
    .query(Q.where('festival_id', 'S2O Songkran'))
    .fetchCount();
  if (existing > 0) return;

  await db.write(async () => {
    for (const stageSeed of S2O_STAGES) {
      const stage = await db.get<Stage>('stages').create((r) => {
        r.stageName = stageSeed.name;
        r.festivalId = 'S2O Songkran';
        r.color = stageSeed.color;
      });

      for (const perf of stageSeed.performances) {
        await db.get<Performance>('performances').create((r) => {
          r.artist = perf.artist;
          r.stageId = stage.id;
          r.startTime = t(perf.start);
          r.endTime = t(perf.end);
          r.genre = perf.genre;
          r.spotifyPreviewUrl = perf.spotifyPreviewUrl;
        });
      }
    }
  });
}
