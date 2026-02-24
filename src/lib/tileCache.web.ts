/**
 * Blackout Mode — tile pre-caching via the browser Cache API.
 * Downloads CARTO dark tiles for both festival locations and serves
 * them from local storage when the network is unavailable.
 *
 * NOTE: For production, replace CARTO tiles with a self-hosted tile server
 * or a provider that explicitly permits offline caching in their ToS.
 */

export const CACHE_NAME = 'festival-map-tiles-v1';

export function tileUrl(z: number, x: number, y: number): string {
  return `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
}

function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z
  );
}

function lngToTileX(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}

function tilesAround(lat: number, lng: number, z: number, radius: number): string[] {
  const cx = lngToTileX(lng, z);
  const cy = latToTileY(lat, z);
  const result: string[] = [];
  for (let x = cx - radius; x <= cx + radius; x++) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      result.push(tileUrl(z, x, y));
    }
  }
  return result;
}

/**
 * Builds the full list of tile URLs to cache for Blackout Mode.
 * Covers:
 *  - World overview at zoom 2-3 (all tiles)
 *  - Both venues at zoom 4-6 (city context)
 *  - Both venues at zoom 12-14 (venue approach roads)
 *  - S2O + Hideout at zoom 17 (stadium grounds, ~5x5 = 25 tiles each)
 *  - S2O + Hideout at zoom 18 (individual pathways, ~7x7 = 49 tiles each)
 */
export function buildTileManifest(): string[] {
  const urls = new Set<string>();

  // Full world at zoom 2-3 (~80 tiles total)
  for (let z = 2; z <= 3; z++) {
    const n = 2 ** z;
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        urls.add(tileUrl(z, x, y));
      }
    }
  }

  // City-level context (zoom 4-6)
  for (let z = 4; z <= 6; z++) {
    tilesAround(13.75, 100.5, z, z - 2).forEach((u) => urls.add(u));
    tilesAround(44.55, 14.88, z, z - 2).forEach((u) => urls.add(u));
  }

  // Venue approach roads (zoom 12-14)
  for (let z = 12; z <= 14; z++) {
    tilesAround(13.754, 100.501, z, 2).forEach((u) => urls.add(u));
    tilesAround(44.548, 14.882, z, 2).forEach((u) => urls.add(u));
  }

  // Tactical: stadium grounds (zoom 17, 5×5 grid = 25 tiles per venue)
  tilesAround(13.754, 100.501, 17, 2).forEach((u) => urls.add(u));
  tilesAround(44.548, 14.882, 17, 2).forEach((u) => urls.add(u));

  // Ultra-tactical: individual pathways (zoom 18, 7×7 grid = 49 tiles per venue)
  tilesAround(13.754, 100.501, 18, 3).forEach((u) => urls.add(u));
  tilesAround(44.548, 14.882, 18, 3).forEach((u) => urls.add(u));

  return [...urls];
}

/** Returns true if enough tiles are cached to consider the map offline-ready. */
export async function checkOfflineReady(): Promise<boolean> {
  if (!('caches' in window)) return false;
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  return keys.length >= 150; // world + city + venue approach + tactical zoom 17-18
}

/**
 * Downloads all manifest tiles into the Cache API.
 * Already-cached tiles are skipped. Individual failures are non-fatal.
 * @param onProgress Callback with 0-100 percentage.
 */
export async function downloadMapTiles(onProgress: (pct: number) => void): Promise<void> {
  if (!('caches' in window)) return;

  const urls = buildTileManifest();
  const cache = await caches.open(CACHE_NAME);
  let done = 0;

  const CONCURRENCY = 8;
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    await Promise.allSettled(
      urls.slice(i, i + CONCURRENCY).map(async (url) => {
        if (!(await cache.match(url))) {
          try {
            await cache.add(url);
          } catch {
            // Tile fetch failed — skip silently, map degrades gracefully
          }
        }
        onProgress(Math.round((++done / urls.length) * 100));
      })
    );
  }
}

export async function clearTileCache(): Promise<void> {
  if ('caches' in window) await caches.delete(CACHE_NAME);
}
