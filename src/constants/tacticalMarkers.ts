/**
 * Static safety POIs for festival venues.
 * Stored as constants (not in WatermelonDB) because this is venue infrastructure
 * data that never changes, requires no user interaction, and must be available
 * offline without a DB migration.
 *
 * Markers are only rendered on the map when zoom > 5 to avoid clutter.
 */

export type MarkerIcon = 'plus' | 'droplet' | 'exit';

export type TacticalMarker = {
  id: string;
  festivalId: string; // matches seeds.ts festival name for linking
  lat: number;
  lng: number;
  icon: MarkerIcon;
  label: string;
};

export const TACTICAL_MARKERS: TacticalMarker[] = [
  // ── S2O Songkran — Rajamangala Stadium, Bangkok ──────────────────────────
  {
    id: 's2o-medical-1',
    festivalId: 'S2O Songkran',
    lat: 13.754,
    lng: 100.501,
    icon: 'plus',
    label: 'Medical Tent',
  },
  {
    id: 's2o-water-1',
    festivalId: 'S2O Songkran',
    lat: 13.752,
    lng: 100.505,
    icon: 'droplet',
    label: 'Water Station',
  },

  // ── Hideout Festival — Zrće Beach, Croatia ────────────────────────────────
  {
    id: 'hideout-medical-1',
    festivalId: 'Hideout Festival',
    lat: 44.548,
    lng: 14.882,
    icon: 'plus',
    label: 'Medical Tent',
  },
  {
    id: 'hideout-water-1',
    festivalId: 'Hideout Festival',
    lat: 44.553,
    lng: 14.876,
    icon: 'droplet',
    label: 'Water Station',
  },
  {
    id: 'hideout-exit-1',
    festivalId: 'Hideout Festival',
    lat: 44.551,
    lng: 14.885,
    icon: 'exit',
    label: 'Emergency Exit',
  },
];
