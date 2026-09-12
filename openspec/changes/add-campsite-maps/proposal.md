## Why

The core catalog only links out to Google Maps. This change adds in-app maps: a
catalog-wide map with a pin for every campsite, and a mini-map on each campsite
detail page — so the catalog reads as a map of where we have been, not just a
list.

## What Changes

- Add `leaflet` + `react-leaflet` (and `@types/leaflet`) to the frontend. Tiles
  come from OpenStreetMap; no API key or billing account.
- `CampingPage` gains an all-pins map above the catalog grid: one marker per
  campsite with valid coordinates, the view fitted to their bounds, each marker
  linking to `/camping/:id`.
- `CampsiteDetailPage` gains a single-pin mini-map centered on the campsite.
- `CampsiteForm` shows a live preview pin that moves as the pasted coordinates
  parse, giving immediate "is this the right spot?" feedback before saving.
- No backend changes — `GET /api/campsites` already returns `lat`/`lng`.

## Capabilities

### New Capabilities

- `campsite-map`: rendering campsite locations on an interactive map — the
  catalog-wide pin map, the per-campsite mini-map, and the coordinate-entry
  preview pin.

### Modified Capabilities

<!-- None. The catalog and detail views are extended with a map region; no
     existing behavior contract changes. -->

## Impact

- **Depends on `add-campsite-catalog-core`** (catalog list with coordinates,
  `CampingPage`, `CampsiteDetailPage`, `CampsiteForm`, `parseCoordinates`).
  Independent of `add-campsite-visits` and `add-campsite-photos`.
- **Frontend only**: `fargopolis-web/package.json` (new deps);
  `src/components/camping/CampsiteMap.tsx`, `MiniMap.tsx`, and a shared
  `MapMarkerIcon` helper; edits to `CampingPage`, `CampsiteDetailPage`,
  `CampsiteForm`. Leaflet CSS imported once.
- **New dependencies**: `leaflet`, `react-leaflet`, `@types/leaflet` — first
  mapping libraries in the repo. Bundle size ~ 45 KB gz for Leaflet core.
- **External calls**: OSM tile requests from the browser to
  `*.tile.openstreetmap.org`. Verify no CSP blocks them; honor the OSM tile
  usage policy with proper attribution.
