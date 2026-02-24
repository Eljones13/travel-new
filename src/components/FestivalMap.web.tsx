import React, { useEffect, useState, useCallback } from 'react';
import { FestivalPin, SquadPin, TacticalMarker } from './FestivalMap';
import { checkOfflineReady, downloadMapTiles, CACHE_NAME } from '../lib/tileCache.web';
import { COLORS } from '../constants/Theme';

// ── Web-compatible mono typography (mirrors TYPOGRAPHY.monoSm) ────────────────

const MONO: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  letterSpacing: '0.8px',
};

// ── Leaflet CSS ───────────────────────────────────────────────────────────────

function useLeafletCSS() {
  useEffect(() => {
    const id = 'leaflet-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // Satellite HUD filter — desaturates tile layer only, markers stay vivid
    const hudId = 'leaflet-hud-style';
    if (!document.getElementById(hudId)) {
      const style = document.createElement('style');
      style.id = hudId;
      style.textContent = `
        .leaflet-tile-pane { filter: brightness(0.72) contrast(1.2) saturate(0.45); }
        .leaflet-control-zoom a {
          background: rgba(13,13,13,0.92) !important;
          color: #00F2FF !important;
          border-color: rgba(0,242,255,0.3) !important;
          font-family: monospace !important;
        }
        .leaflet-control-attribution {
          background: rgba(13,13,13,0.7) !important;
          color: rgba(255,255,255,0.25) !important;
          font-size: 9px !important;
        }
        .leaflet-popup-content-wrapper {
          background: #1A1A1A !important;
          border: 0.5px solid rgba(0,242,255,0.3) !important;
          border-radius: 8px !important;
          box-shadow: 0 0 12px rgba(0,242,255,0.3) !important;
        }
        .leaflet-popup-tip { background: #1A1A1A !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);
}

// ── Festival pin markers ───────────────────────────────────────────────────────

const PIN_COLOURS: Record<string, string> = {
  wet:   COLORS.magenta,
  beach: COLORS.cyan,
  none:  COLORS.orange,
};

function makeNeonIcon(L: typeof import('leaflet'), colour: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${colour}22;
      border:2px solid ${colour};
      box-shadow:0 0 10px 5px ${colour}AA,0 0 24px 10px ${colour}55,inset 0 0 6px ${colour}33;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });
}

// ── Tactical safety marker icons ──────────────────────────────────────────────
// plus  = Medical   → Safety Orange glow
// droplet = Water   → Cyber Cyan glow
// exit  = Emergency → Safety Orange glow

const TACTICAL_SYMBOLS: Record<string, string> = {
  plus:    '✚',
  droplet: '◉',
  exit:    '▶',
};

const TACTICAL_COLOURS: Record<string, string> = {
  plus:    COLORS.orange,
  droplet: COLORS.cyan,
  exit:    COLORS.orange,
};

function makeTacticalIcon(L: typeof import('leaflet'), icon: string) {
  const sym    = TACTICAL_SYMBOLS[icon] ?? '●';
  const colour = TACTICAL_COLOURS[icon] ?? COLORS.orange;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${colour}1A;
      border:2px solid ${colour};
      display:flex;align-items:center;justify-content:center;
      font-size:12px;color:${colour};line-height:1;
      box-shadow:0 0 10px 5px ${colour}AA,0 0 26px 12px ${colour}55,inset 0 0 8px ${colour}22;
    ">${sym}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -18],
  });
}

// ── Squad pin marker — Neon Magenta glow ──────────────────────────────────────

function makeSquadIcon(L: typeof import('leaflet'), name: string) {
  const colour = COLORS.magenta;
  // Truncate long names so the label stays compact on the map
  const label = name.length > 10 ? name.slice(0, 9) + '…' : name;
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="
        width:22px;height:22px;border-radius:50%;
        background:${colour}22;
        border:2px solid ${colour};
        display:flex;align-items:center;justify-content:center;
        font-size:12px;color:${colour};
        box-shadow:0 0 10px 4px ${colour}99,0 0 22px 10px ${colour}44;
      ">●</div>
      <span style="
        font-family:monospace;font-size:9px;letter-spacing:0.8px;
        color:${colour};background:${COLORS.background}cc;
        padding:1px 4px;border-radius:3px;border:0.5px solid ${colour}66;
        white-space:nowrap;
      ">${label}</span>
    </div>`,
    iconSize: [60, 40],
    iconAnchor: [30, 11],
    popupAnchor: [0, -20],
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
// Swap S2O_SITE_MAP_URL for the official venue map PNG/SVG in production.

const S2O_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" rx="4" fill="#0a0a0a" opacity="0.95"/>
  <rect x="4" y="4" width="592" height="392" rx="5" fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <path d="M300 380 L300 265 L140 175 M300 265 L460 175 M140 175 L460 175"
    stroke="#2a2a2a" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="140" y1="175" x2="60" y2="95" stroke="#222" stroke-width="10" stroke-linecap="round"/>
  <line x1="460" y1="175" x2="540" y2="95" stroke="#222" stroke-width="10" stroke-linecap="round"/>
  <!-- Main Stage -->
  <rect x="230" y="28" width="140" height="90" rx="6" fill="${COLORS.magenta}14" stroke="${COLORS.magenta}" stroke-width="2.5"/>
  <text x="300" y="72" text-anchor="middle" fill="${COLORS.magenta}" font-size="11" font-family="monospace" font-weight="bold">MAIN STAGE</text>
  <text x="300" y="88" text-anchor="middle" fill="${COLORS.magenta}66" font-size="8" font-family="monospace">THE SPLASH ZONE</text>
  <!-- Water Dome -->
  <rect x="40" y="100" width="120" height="75" rx="6" fill="${COLORS.cyan}14" stroke="${COLORS.cyan}" stroke-width="2.5"/>
  <text x="100" y="141" text-anchor="middle" fill="${COLORS.cyan}" font-size="10" font-family="monospace" font-weight="bold">WATER DOME</text>
  <text x="100" y="156" text-anchor="middle" fill="${COLORS.cyan}55" font-size="7.5" font-family="monospace">HOUSE &amp; TECHNO</text>
  <!-- The Oasis -->
  <rect x="440" y="100" width="120" height="75" rx="6" fill="${COLORS.gold}14" stroke="${COLORS.gold}" stroke-width="2.5"/>
  <text x="500" y="141" text-anchor="middle" fill="${COLORS.gold}" font-size="10" font-family="monospace" font-weight="bold">THE OASIS</text>
  <text x="500" y="156" text-anchor="middle" fill="${COLORS.gold}55" font-size="7.5" font-family="monospace">CHILL · FOOD</text>
  <!-- Medical POI -->
  <circle cx="210" cy="248" r="13" fill="${COLORS.orange}18" stroke="${COLORS.orange}" stroke-width="1.5"/>
  <text x="210" y="253" text-anchor="middle" fill="${COLORS.orange}" font-size="12" font-family="monospace">✚</text>
  <!-- Water POI -->
  <circle cx="390" cy="248" r="13" fill="${COLORS.cyan}18" stroke="${COLORS.cyan}" stroke-width="1.5"/>
  <text x="390" y="253" text-anchor="middle" fill="${COLORS.cyan}" font-size="12" font-family="monospace">◉</text>
  <!-- Entry / Exit -->
  <rect x="263" y="307" width="74" height="22" rx="3" fill="#FFFFFF08" stroke="#444" stroke-width="1.5"/>
  <text x="300" y="322" text-anchor="middle" fill="#666" font-size="8" font-family="monospace">ENTRY ▼</text>
  <rect x="263" y="355" width="74" height="22" rx="3" fill="${COLORS.orange}18" stroke="${COLORS.orange}" stroke-width="1.5"/>
  <text x="300" y="370" text-anchor="middle" fill="${COLORS.orange}" font-size="8" font-family="monospace">EXIT ▶</text>
  <rect x="24" y="355" width="74" height="22" rx="3" fill="${COLORS.orange}18" stroke="${COLORS.orange}" stroke-width="1.5"/>
  <text x="61" y="370" text-anchor="middle" fill="${COLORS.orange}" font-size="8" font-family="monospace">EXIT ▶</text>
  <rect x="502" y="355" width="74" height="22" rx="3" fill="${COLORS.orange}18" stroke="${COLORS.orange}" stroke-width="1.5"/>
  <text x="539" y="370" text-anchor="middle" fill="${COLORS.orange}" font-size="8" font-family="monospace">EXIT ▶</text>
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
          const colour = TACTICAL_COLOURS[m.icon] ?? COLORS.orange;
          return (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={makeTacticalIcon(L, m.icon)}>
              <Popup>
                <div style={popupStyle(colour)}>
                  <strong style={{ display: 'block', marginBottom: 3 }}>{m.label}</strong>
                  <span style={{ ...MONO, color: colour, textTransform: 'uppercase' }}>
                    {m.icon === 'plus' ? 'MEDICAL' : m.icon === 'droplet' ? 'WATER' : 'EXIT'}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </>
    );
  };
}

// ── Coordinate tracker (factory) ──────────────────────────────────────────────
// Renders nothing in the map — fires onMove whenever the viewport changes.

function createCoordTracker(
  useMap: typeof import('react-leaflet')['useMap'],
  useMapEvents: typeof import('react-leaflet')['useMapEvents']
) {
  return function CoordTracker({ onMove }: { onMove: (lat: number, lng: number) => void }) {
    const map = useMap();
    useMapEvents({
      moveend: () => { const c = map.getCenter(); onMove(c.lat, c.lng); },
      zoomend: () => { const c = map.getCenter(); onMove(c.lat, c.lng); },
    });
    return null;
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
  CoordTracker: ReturnType<typeof createCoordTracker>;
  L: typeof import('leaflet');
};

// ── FestivalMap ───────────────────────────────────────────────────────────────

export default function FestivalMap({
  festivals,
  markers = [],
  squadPins = [],
}: {
  festivals: FestivalPin[];
  markers?: TacticalMarker[];
  squadPins?: SquadPin[];
}) {
  useLeafletCSS();

  const [offlineStatus, setOfflineStatus] = useState<'checking' | 'ready' | 'not-ready'>('checking');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [Leaflet, setLeaflet] = useState<LazyLeaflet | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(() =>
    festivals.length > 0 ? [festivals[0].lat, festivals[0].lng] : [20, 20]
  );

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
        CoordTracker: createCoordTracker(rl.useMap, rl.useMapEvents),
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
      <div style={{
        flex: 1,
        background: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ ...MONO, color: COLORS.textSecondary }}>LOADING MAP…</span>
      </div>
    );
  }

  const { MapContainer, Marker, Popup, OfflineTileLayer, ZoomAwareTacticalMarkers, ZoomAwareSiteMap, CoordTracker, L } = Leaflet;
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
        style={{ width: '100%', height: '100%', minHeight: 300, background: COLORS.background }}
      >
        <OfflineTileLayer />

        {/* Festival pins */}
        {festivals.map((f) => {
          const colour = PIN_COLOURS[f.trigger] ?? COLORS.orange;
          return (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={makeNeonIcon(L, colour)}>
              <Popup>
                <div style={popupStyle(colour)}>
                  <strong style={{ display: 'block', marginBottom: 3 }}>{f.name}</strong>
                  <span style={{ ...MONO, color: colour, textTransform: 'uppercase' }}>
                    {f.trigger}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Squad pins — Neon Magenta */}
        {squadPins.map((sq) => (
          <Marker key={sq.id} position={[sq.lat, sq.lng]} icon={makeSquadIcon(L, sq.name)}>
            <Popup>
              <div style={popupStyle(COLORS.magenta)}>
                <strong style={{ display: 'block', marginBottom: 3 }}>{sq.name}</strong>
                <span style={{ ...MONO, color: COLORS.magenta }}>SQUAD MEMBER</span>
              </div>
            </Popup>
          </Marker>
        ))}

        <ZoomAwareSiteMap />
        <ZoomAwareTacticalMarkers markers={markers} />
        <CoordTracker onMove={(lat, lng) => setMapCenter([lat, lng])} />
      </MapContainer>

      {/* ── HUD Frame — corner brackets + crosshair ─────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 900 }}>
        {/* Corners */}
        <div style={{ position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderTop: `1.5px solid ${COLORS.cyan}`, borderLeft: `1.5px solid ${COLORS.cyan}`, opacity: 0.65 }} />
        <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderTop: `1.5px solid ${COLORS.cyan}`, borderRight: `1.5px solid ${COLORS.cyan}`, opacity: 0.65 }} />
        <div style={{ position: 'absolute', bottom: 10, left: 10, width: 22, height: 22, borderBottom: `1.5px solid ${COLORS.cyan}`, borderLeft: `1.5px solid ${COLORS.cyan}`, opacity: 0.65 }} />
        <div style={{ position: 'absolute', bottom: 10, right: 10, width: 22, height: 22, borderBottom: `1.5px solid ${COLORS.cyan}`, borderRight: `1.5px solid ${COLORS.cyan}`, opacity: 0.65 }} />
        {/* Crosshair */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 32, height: 32 }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: `${COLORS.cyan}55`, marginTop: -0.5 }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: `${COLORS.cyan}55`, marginLeft: -0.5 }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', border: `1px solid ${COLORS.cyan}88` }} />
        </div>
      </div>

      {/* Blackout Mode badge — floats over the map */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
        {offlineStatus === 'ready' ? (
          <div style={badge('#00FF88')}>✓ OFFLINE READY</div>
        ) : downloading ? (
          <div style={{ ...badge(COLORS.gold), minWidth: 148 }}>
            <div style={{ marginBottom: 5 }}>SAVING… {progress}%</div>
            <div style={{ background: '#333', borderRadius: 3, height: 4 }}>
              <div style={{
                background: COLORS.gold,
                borderRadius: 3,
                height: 4,
                width: `${progress}%`,
                transition: 'width 0.15s ease',
              }} />
            </div>
          </div>
        ) : offlineStatus === 'not-ready' ? (
          <button onClick={handleDownload} style={downloadBtnStyle}>
            ⬇ SAVE FOR OFFLINE
          </button>
        ) : null}
      </div>

      {/* Tactical marker legend */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        zIndex: 1000,
        background: 'rgba(13,13,13,0.92)',
        borderRadius: 8,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        backdropFilter: 'blur(8px)',
        border: `0.5px solid ${COLORS.glassBorder}`,
        ...MONO,
      }}>
        <span style={{ color: COLORS.orange }}>● MEDICAL</span>
        <span style={{ color: COLORS.cyan }}>● WATER</span>
        <span style={{ color: COLORS.orange }}>● EXIT</span>
        <span style={{ color: COLORS.magenta }}>● SQUAD PIN</span>
        <div style={{ width: '100%', height: '0.5px', background: COLORS.glassBorder, margin: '4px 0' }} />
        <span style={{ color: COLORS.textSecondary, fontSize: 9, opacity: 0.5 }}>ZOOM IN FOR POIs</span>
        <span style={{ color: COLORS.cyan, fontSize: 9, opacity: 0.8, letterSpacing: '0.5px' }}>
          {mapCenter[0].toFixed(4)}°N
        </span>
        <span style={{ color: COLORS.cyan, fontSize: 9, opacity: 0.8, letterSpacing: '0.5px' }}>
          {mapCenter[1].toFixed(4)}°E
        </span>
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const popupStyle = (colour: string): React.CSSProperties => ({
  background: COLORS.surface,
  color: COLORS.textPrimary,
  padding: '6px 10px',
  borderRadius: 8,
  minWidth: 130,
  border: `0.5px solid ${colour}55`,
});

const badge = (colour: string): React.CSSProperties => ({
  background: 'rgba(13,13,13,0.92)',
  color: colour,
  padding: '5px 12px',
  borderRadius: 20,
  fontWeight: 700,
  border: `0.5px solid ${colour}66`,
  backdropFilter: 'blur(8px)',
  ...MONO,
});

const downloadBtnStyle: React.CSSProperties = {
  background: COLORS.magenta,
  color: COLORS.background,
  padding: '5px 14px',
  borderRadius: 20,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  letterSpacing: '0.8px',
  ...MONO,
};
