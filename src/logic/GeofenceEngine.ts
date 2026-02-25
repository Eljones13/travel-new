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

export type ZoneAlertType = 'BLACKOUT_RISK' | 'CROWD_CRUSH_RISK';

export interface TacticalZone {
  id: string;
  name: string;
  festivalName: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  alertType: ZoneAlertType;
  tacticalMessage: string;
}

export interface ZoneAlert {
  zone: TacticalZone;
  alertType: ZoneAlertType;
  distanceMeters: number;
  tacticalMessage: string;
}

// ── Tactical Zone Registry ────────────────────────────────────────────────────
// Add new zones here as more festival layouts are mapped.

export const TACTICAL_ZONES: TacticalZone[] = [
  {
    id: 'creamfields-steel-yard',
    name: 'The Steel Yard',
    festivalName: 'Creamfields',
    lat: 53.336,
    lng: -2.617,
    radiusMeters: 100,
    alertType: 'BLACKOUT_RISK',
    tacticalMessage: 'SIGNAL SHIELDED: ENGAGE SNEAKERNET',
  },
  {
    id: 'reading-main-stage',
    name: 'The Main Stage',
    festivalName: 'Reading Festival',
    lat: 51.465,
    lng: -0.988,
    radiusMeters: 150,
    alertType: 'CROWD_CRUSH_RISK',
    tacticalMessage: 'CROWD DENSITY CRITICAL: HOLD POSITION',
  },
];

// ── checkZoneProximity ────────────────────────────────────────────────────────
// Call with device GPS coordinates. Returns the nearest active alert, or null.
// Multiple zones can be active — returns the one the user is deepest inside
// (smallest distance relative to radius).

export function checkZoneProximity(
  userLat: number,
  userLng: number,
): ZoneAlert | null {
  let closest: ZoneAlert | null = null;
  let closestRatio = Infinity; // lower = deeper inside zone

  for (const zone of TACTICAL_ZONES) {
    const dist = haversineMeters(userLat, userLng, zone.lat, zone.lng);
    if (dist <= zone.radiusMeters) {
      const ratio = dist / zone.radiusMeters;
      if (ratio < closestRatio) {
        closestRatio = ratio;
        closest = {
          zone,
          alertType: zone.alertType,
          distanceMeters: Math.round(dist),
          tacticalMessage: zone.tacticalMessage,
        };
      }
    }
  }

  return closest;
}
