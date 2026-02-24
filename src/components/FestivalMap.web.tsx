import React, { useEffect, useState, useCallback } from 'react';
import { FestivalPin, TacticalMarker } from './FestivalMap';
import { checkOfflineReady, downloadMapTiles, CACHE_NAME } from '../lib/tileCache.web';

// ── Leaflet CSS ───────────────────────────────────────────────────────────────

function useLeafletCSS() {
  useEffect(() => {
    const id = 'leaflet-css';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);
}

// ── Neon markers (festival pins) ──────────────────────────────────────────────

const PIN_COLOURS: Record<string, string> = {
  wet: '#FF00FF',
  beach: '#00FFFF',
  none: '#FF6B35',
};

function makeNeonIcon(L: typeof import('leaflet'), colour: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${colour};box-shadow:0 0 8px 4px ${colour}99,0 0 20px 8px ${colour}44;border:2px solid #fff;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -14],
  });
}

// ── Tactical safety marker icons ──────────────────────────────────────────────

const TACTICAL_SYMBOLS: Record<string, string> = {
  plus: '✚',
  droplet: '◉',
  exit: '▶',
};

const TACTICAL_COLOURS: Record<string, string> = {
  plus: '#FF6B35',
  droplet: '#00C8FF',
  exit: '#FF6B35',
};

function makeTacticalIcon(L: typeof import('leaflet'), icon: string) {
  const sym = TACTICAL_SYMBOLS[icon] ?? '●';
  const colour = TACTICAL_COLOURS[icon] ?? '#FF6B35';
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:4px;background:#0D0D0D;border:1.5px solid ${colour};display:flex;align-items:center;justify-content:center;font-size:11px;color:${colour};line-height:1;box-shadow:0 0 6px 2px ${colour}55;">${sym}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -16],
  });
}

// ── Cache-aware tile layer (factory) ─────────────────────────────────────────

function createOfflineTileLayer(
  useMap: typeof import('react-leaflet')['useMap'],
  L: typeof import('leaflet')
) {
  return function OfflineTileLayer() {
    const map = useMap();

    useEffect(() => {
      const layer = new L.TileLayer(
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        { attribution: '&copy; <a href="https://carto.com/">CARTO</a>' }
      );

      (layer as any).createTile = function (
        coords: { x: number; y: number; z: number },
        done: (err: Error | null, tile: HTMLElement) => void
      ) {
        const url = `https://a.basemaps.cartocdn.com/dark_all/${coords.z}/${coords.x}/${coords.y}.png`;
        const img = document.createElement('img');
        img.alt = '';

        const loadDirect = () => {
          img.onload = () => done(null, img);
          img.onerror = (e) => done(e as unknown as Error, img);
          img.src = url;
        };

        if (!('caches' in window)) {
          loadDirect();
          return img;
        }

        caches
          .open(CACHE_NAME)
          .then((cache) =>
            cache.match(url).then((cached) => {
              if (cached) {
                cached.blob().then((blob) => {
                  const objUrl = URL.createObjectURL(blob);
                  img.onload = () => { URL.revokeObjectURL(objUrl); done(null, img); };
                  img.onerror = (e) => { URL.revokeObjectURL(objUrl); done(e as unknown as Error, img); };
                  img.src = objUrl;
                }).catch(loadDirect);
              } else {
                loadDirect();
              }
            })
          )
          .catch(loadDirect);

        return img;
      };

      map.addLayer(layer);
      return () => { map.removeLayer(layer); };
    }, [map]);

    return null;
  };
}

// ── Zoom-aware SVG site map overlay (factory) ────────────────────────────────
// Appears at zoom ≥ 13 over the S2O Rajamangala Stadium footprint.
// Swap SITE_MAP_URL for the official venue map PNG/SVG in production.

const S2O_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" rx="4" fill="#0a0a0a" opacity="0.95"/>
  <rect x="4" y="4" width="592" height="392" rx="5" fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <path d="M300 380 L300 265 L140 175 M300 265 L460 175 M140 175 L460 175"
    stroke="#2a2a2a" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="140" y1="175" x2="60" y2="95" stroke="#222" stroke-width="10" stroke-linecap="round"/>
  <line x1="460" y1="175" x2="540" y2="95" stroke="#222" stroke-width="10" stroke-linecap="round"/>
  <rect x="230" y="28" width="140" height="90" rx="6" fill="#FF00FF14" stroke="#FF00FF" stroke-width="2.5"/>
  <text x="300" y="72" text-anchor="middle" fill="#FF00FF" font-size="11" font-family="monospace" font-weight="bold">MAIN STAGE</text>
  <text x="300" y="88" text-anchor="middle" fill="#FF00FF66" font-size="8" font-family="monospace">THE SPLASH ZONE</text>
  <rect x="40" y="100" width="120" height="75" rx="6" fill="#00C8FF14" stroke="#00C8FF" stroke-width="2.5"/>
  <text x="100" y="141" text-anchor="middle" fill="#00C8FF" font-size="10" font-family="monospace" font-weight="bold">WATER DOME</text>
  <text x="100" y="156" text-anchor="middle" fill="#00C8FF55" font-size="7.5" font-family="monospace">HOUSE &amp; TECHNO</text>
  <rect x="440" y="100" width="120" height="75" rx="6" fill="#FFD16614" stroke="#FFD166" stroke-width="2.5"/>
  <text x="500" y="141" text-anchor="middle" fill="#FFD166" font-size="10" font-family="monospace" font-weight="bold">THE OASIS</text>
  <text x="500" y="156" text-anchor="middle" fill="#FFD16655" font-size="7.5" font-family="monospace">CHILL · FOOD</text>
  <circle cx="210" cy="248" r="13" fill="#FF6B3518" stroke="#FF6B35" stroke-width="1.5"/>
  <text x="210" y="253" text-anchor="middle" fill="#FF6B35" font-size="12" font-family="monospace">✚</text>
  <circle cx="390" cy="248" r="13" fill="#00C8FF18" stroke="#00C8FF" stroke-width="1.5"/>
  <text x="390" y="253" text-anchor="middle" fill="#00C8FF" font-size="12" font-family="monospace">◉</text>
  <rect x="263" y="307" width="74" height="22" rx="3" fill="#FFFFFF08" stroke="#444" stroke-width="1.5"/>
  <text x="300" y="322" text-anchor="middle" fill="#666" font-size="8" font-family="monospace">ENTRY ▼</text>
  <rect x="263" y="355" width="74" height="22" rx="3" fill="#FF6B3518" stroke="#FF6B35" stroke-width="1.5"/>
  <text x="300" y="370" text-anchor="middle" fill="#FF6B35" font-size="8" font-family="monospace">EXIT ▶</text>
  <rect x="24" y="355" width="74" height="22" rx="3" fill="#FF6B3518" stroke="#FF6B35" stroke-width="1.5"/>
  <text x="61" y="370" text-anchor="middle" fill="#FF6B35" font-size="8" font-family="monospace">EXIT ▶</text>
  <rect x="502" y="355" width="74" height="22" rx="3" fill="#FF6B3518" stroke="#FF6B35" stroke-width="1.5"/>
  <text x="539" y="370" text-anchor="middle" fill="#FF6B35" font-size="8" font-family="monospace">EXIT ▶</text>
  <text x="300" y="394" text-anchor="middle" fill="#2a2a2a" font-size="7" font-family="monospace">S2O SONGKRAN 2026 · RAJAMANGALA STADIUM · PLACEHOLDER — REPLACE WITH OFFICIAL MAP</text>
</svg>`;

const S2O_SITE_MAP_URL =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(S2O_SVG);

// Geographic bounds: ~1.8km × 1.4km around Rajamangala Stadium
const S2O_SITE_MAP_BOUNDS: [[number, number], [number, number]] = [
  [13.745, 100.492], // SW
  [13.763, 100.510], // NE
];

function createZoomAwareSiteMap(
  useMap: typeof import('react-leaflet')['useMap'],
  useMapEvents: typeof import('react-leaflet')['useMapEvents'],
  ImageOverlay: typeof import('react-leaflet')['ImageOverlay']
) {
  return function ZoomAwareSiteMap() {
    const map = useMap();
    const [zoom, setZoom] = useState(() => map.getZoom());
    useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
    if (zoom < 13) return null;
    return (
      <ImageOverlay
        url={S2O_SITE_MAP_URL}
        bounds={S2O_SITE_MAP_BOUNDS}
        opacity={0.75}
      />
    );
  };
}

// ── Zoom-aware tactical markers (factory) ─────────────────────────────────────
// Only renders when zoom > 5 to avoid clutter at world-overview zoom levels.

function createZoomAwareTacticalMarkers(
  useMap: typeof import('react-leaflet')['useMap'],
  useMapEvents: typeof import('react-leaflet')['useMapEvents'],
  Marker: typeof import('react-leaflet')['Marker'],
  Popup: typeof import('react-leaflet')['Popup'],
  L: typeof import('leaflet')
) {
  return function ZoomAwareTacticalMarkers({ markers }: { markers: TacticalMarker[] }) {
    const map = useMap();
    const [zoom, setZoom] = useState(() => map.getZoom());

    useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

    if (zoom <= 5 || markers.length === 0) return null;

    return (
      <>
        {markers.map((m) => {
          const colour = TACTICAL_COLOURS[m.icon] ?? '#FF6B35';
          return (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={makeTacticalIcon(L, m.icon)}>
              <Popup>
                <div style={{
                  background: '#1A1A1A',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: colour,
                } as React.CSSProperties}>
                  {m.label}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </>
    );
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type LazyLeaflet = {
  MapContainer: typeof import('react-leaflet')['MapContainer'];
  Marker: typeof import('react-leaflet')['Marker'];
  Popup: typeof import('react-leaflet')['Popup'];
  OfflineTileLayer: ReturnType<typeof createOfflineTileLayer>;
  ZoomAwareTacticalMarkers: ReturnType<typeof createZoomAwareTacticalMarkers>;
  ZoomAwareSiteMap: ReturnType<typeof createZoomAwareSiteMap>;
  L: typeof import('leaflet');
};

// ── FestivalMap ───────────────────────────────────────────────────────────────

export default function FestivalMap({
  festivals,
  markers = [],
}: {
  festivals: FestivalPin[];
  markers?: TacticalMarker[];
}) {
  useLeafletCSS();

  const [offlineStatus, setOfflineStatus] = useState<'checking' | 'ready' | 'not-ready'>('checking');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [Leaflet, setLeaflet] = useState<LazyLeaflet | null>(null);

  useEffect(() => {
    checkOfflineReady().then((ready) =>
      setOfflineStatus(ready ? 'ready' : 'not-ready')
    );
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, l]) => {
      setLeaflet({
        MapContainer: rl.MapContainer,
        Marker: rl.Marker,
        Popup: rl.Popup,
        OfflineTileLayer: createOfflineTileLayer(rl.useMap, l.default),
        ZoomAwareTacticalMarkers: createZoomAwareTacticalMarkers(
          rl.useMap,
          rl.useMapEvents,
          rl.Marker,
          rl.Popup,
          l.default
        ),
        ZoomAwareSiteMap: createZoomAwareSiteMap(rl.useMap, rl.useMapEvents, rl.ImageOverlay),
        L: l.default,
      });
    });
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setProgress(0);
    await downloadMapTiles(setProgress);
    setOfflineStatus('ready');
    setDownloading(false);
  }, []);

  if (!Leaflet) {
    return (
      <div style={{ flex: 1, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#555', fontSize: 14 }}>Loading map…</span>
      </div>
    );
  }

  const { MapContainer, Marker, Popup, OfflineTileLayer, ZoomAwareTacticalMarkers, ZoomAwareSiteMap, L } = Leaflet;
  const center: [number, number] = festivals.length > 0
    ? [festivals[0].lat, festivals[0].lng]
    : [20, 20];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 300 }}>
      <MapContainer
        center={center}
        zoom={3}
        minZoom={2}
        maxZoom={18}
        style={{ width: '100%', height: '100%', minHeight: 300, background: '#0D0D0D' }}
      >
        <OfflineTileLayer />
        {festivals.map((f) => {
          const colour = PIN_COLOURS[f.trigger] ?? '#FF6B35';
          return (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={makeNeonIcon(L, colour)}>
              <Popup>
                <div style={{ background: '#1A1A1A', color: '#fff', padding: '6px 10px', borderRadius: 8, minWidth: 140 }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>{f.name}</strong>
                  <span style={{ color: colour, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
                    {f.trigger}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <ZoomAwareSiteMap />
        <ZoomAwareTacticalMarkers markers={markers} />
      </MapContainer>

      {/* Blackout Mode badge — floats over the map */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
        {offlineStatus === 'ready' ? (
          <div style={badge('#00FF88', '#00FF8830')}>✓ Offline Ready</div>
        ) : downloading ? (
          <div style={{ ...badge('#FFD166', '#FFD16630'), minWidth: 148 }}>
            <div style={{ marginBottom: 5 }}>Saving… {progress}%</div>
            <div style={{ background: '#333', borderRadius: 3, height: 4 }}>
              <div style={{
                background: '#FFD166',
                borderRadius: 3,
                height: 4,
                width: `${progress}%`,
                transition: 'width 0.15s ease',
              }} />
            </div>
          </div>
        ) : offlineStatus === 'not-ready' ? (
          <button onClick={handleDownload} style={downloadBtnStyle}>
            ⬇ Save for Offline
          </button>
        ) : null}
      </div>

      {/* Tactical marker legend — only visible at zoom > 5 */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        zIndex: 1000,
        background: 'rgba(13,13,13,0.85)',
        borderRadius: 8,
        padding: '6px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        backdropFilter: 'blur(4px)',
        border: '1px solid #2A2A2A',
        fontSize: 11,
      }}>
        <span style={{ color: '#FF6B35' }}>✚ Medical</span>
        <span style={{ color: '#00C8FF' }}>◉ Water</span>
        <span style={{ color: '#FF6B35' }}>▶ Exit</span>
        <span style={{ color: '#444', fontSize: 10, marginTop: 2 }}>Zoom in to see POIs</span>
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const badge = (colour: string, border: string): React.CSSProperties => ({
  background: 'rgba(13,13,13,0.9)',
  color: colour,
  padding: '5px 12px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 700,
  border: `1px solid ${border}`,
  backdropFilter: 'blur(4px)',
});

const downloadBtnStyle: React.CSSProperties = {
  background: '#FF00FF',
  color: '#000',
  padding: '5px 14px',
  borderRadius: 20,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: 0.5,
};
