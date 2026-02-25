// ── Haversine Distance ────────────────────────────────────────────────────────
// Returns distance in metres between two WGS-84 coordinates.
// Fully offline — no maps SDK, no network.

function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Zone Types ────────────────────────────────────────────────────────────────

export type TacticalZoneType = 'BLACKOUT_ZONE' | 'CROWD_DENSITY_HIGH';

interface ZoneDef {
  id: string;
  name: string;
  festivalName: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  type: TacticalZoneType;
}

// ── Zone Registry ─────────────────────────────────────────────────────────────
// Add zones here as more festival layouts are mapped.

const ZONES: ZoneDef[] = [
  {
    id: 'creamfields-steel-yard',
    name: 'The Steel Yard',
    festivalName: 'Creamfields',
    lat: 53.3364,
    lng: -2.6171,
    radiusMeters: 150,
    type: 'BLACKOUT_ZONE',
  },
  {
    id: 'reading-main-stage',
    name: 'The Main Stage',
    festivalName: 'Reading Festival',
    lat: 51.4651,
    lng: -0.9882,
    radiusMeters: 150,
    type: 'CROWD_DENSITY_HIGH',
  },
];

// ── getTacticalZone ───────────────────────────────────────────────────────────
// Pass device GPS coordinates. Returns the zone type the user is inside,
// or null if outside all zones. When inside multiple zones, returns the
// one the user is deepest inside (smallest distance / radius ratio).

export function getTacticalZone(
  userLat: number,
  userLng: number,
): TacticalZoneType | null {
  let result: TacticalZoneType | null = null;
  let closestRatio = Infinity;

  for (const zone of ZONES) {
    const dist = haversineMeters(userLat, userLng, zone.lat, zone.lng);
    if (dist <= zone.radiusMeters) {
      const ratio = dist / zone.radiusMeters;
      if (ratio < closestRatio) {
        closestRatio = ratio;
        result = zone.type;
      }
    }
  }

  return result;
}
