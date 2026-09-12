## Context

See `add-campsite-catalog-core`. `CampingPage` already SWR-fetches
`GET /api/campsites` (each entry has `lat`/`lng`), `CampsiteDetailPage` fetches
one campsite, and `CampsiteForm` already parses pasted coordinates via
`parseCoordinates`. No mapping library exists in the repo yet; the app is a Vite
+ React SPA on S3/CloudFront.

## Goals / Non-Goals

**Goals:**

- Interactive maps with zero API keys, accounts, or per-request billing.
- One shared map component config so the catalog map, mini-map, and form preview
  look and behave consistently.
- Maps are additive: if tiles fail, the catalog and detail pages are unaffected.

**Non-Goals:**

- Geocoding a typed place name to coordinates (entry stays paste-only, per the
  core change).
- Clustering, heatmaps, drawing routes, or offline tiles.
- Server-side map/static-image generation.

## Decisions

### Leaflet + react-leaflet, OpenStreetMap tiles

`leaflet` (~45 KB gz) + `react-leaflet` for the React bindings, `@types/leaflet`
for types. Tile layer: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with
the standard `© OpenStreetMap contributors` attribution. This is the only
map stack in the allowlist-free "no key" category that has mature React
bindings.

Alternatives considered:
- **Google Maps JS/Embed API** — needs an API key, a billing account, and key
  referrer restrictions to manage. Rejected for a personal catalog.
- **MapLibre GL + free vector tiles** — nicer rendering but needs a tile
  provider key (MapTiler/Stadia) for anything production-ish. Rejected.
- **Static map image** — no key options are truly free; also loses pan/zoom.

### One `<CampsiteMapBase>` wrapper

A single internal component owns the `MapContainer` setup: tile layer,
attribution, a fixed pixel height via prop, `scrollWheelZoom={false}` (so page
scroll isn't trapped; zoom via buttons / double-click), and the marker icon fix
below. `CampsiteMap`, `MiniMap`, and the form preview all render it with
different children/props.

### Marker icon fix for bundlers

Leaflet's default marker images resolve via CSS relative URLs that break under
Vite. Use an explicit icon built from Vite asset imports:
`import iconUrl from "leaflet/dist/images/marker-icon.png"` (+ `-2x` +
`marker-shadow.png`) and `L.icon({...})`, or a lightweight inline `L.divIcon`
styled with the app's palette. Decide during implementation; the divIcon avoids
shipping the PNGs. Centralize it in `src/components/camping/helpers/mapMarker.ts`.

### Catalog map behavior

- Markers: `campsites.filter(c => isFinite(c.lat) && isFinite(c.lng) && in range)`.
- View: `fitBounds` of all marker positions, with a sane `maxZoom` so a single
  campsite doesn't zoom to street level; fallback center (continental US) when
  there are zero markers, plus an empty-state overlay.
- Each marker has a popup with the campsite name and a link/button to
  `/camping/:id` (react-router `useNavigate`).
- Rendered above the existing grid on `CampingPage`, height ~360px, full width
  of the container.

### Mini-map behavior

`MiniMap({ lat, lng })` — `center=[lat,lng]`, `zoom≈12`, one non-interactive
marker, height ~220px, `dragging`/`zoomControl` still on but compact. Rendered
in the detail header area of `CampsiteDetailPage`.

### Form preview behavior

`CampsiteForm` already holds parsed `{lat,lng} | null` from `parseCoordinates`.
Render `CampsiteMapBase` (height ~200px) with a marker only when non-null; on
change, `flyTo`/`setView` the new point. No marker and a neutral centered view
while unparsed.

### CSS + CSP

`import "leaflet/dist/leaflet.css"` once (in the app entry or the map base
module). Check for a `Content-Security-Policy` (meta tag or CloudFront response
header); if one exists, add `https://*.tile.openstreetmap.org` to `img-src` and
`https://*.tile.openstreetmap.org` / `https://unpkg.com` as needed. If there is
no CSP today, note it and move on.

## Risks / Trade-offs

- **OSM tile usage policy** → It permits light, attributed use; a personal
  catalog is well within it. If traffic ever grows, switch the tile URL to a
  keyed provider — isolated to `CampsiteMapBase`.
- **Leaflet marker/CSS bundler breakage** → Addressed by the explicit-icon
  decision; verified by the build + a manual load in `pnpm dev` and a
  `pnpm build && pnpm preview`.
- **SSR/hydration** → App is a pure client SPA (`createRoot`), so `window`
  access in Leaflet is fine; no SSR guard needed.
- **Map traps scroll on mobile** → `scrollWheelDrag`/`tap` tuned;
  `scrollWheelZoom={false}` on the catalog map keeps page scroll natural.

## Migration Plan

1. `pnpm add leaflet react-leaflet && pnpm add -D @types/leaflet` in
   `fargopolis-web`.
2. Ship the components and wire them into the three pages.
3. Deploy `FargopolisFrontend` only. No API deploy.
4. Rollback: revert the frontend deploy. Nothing else is touched; no data
   implications.
