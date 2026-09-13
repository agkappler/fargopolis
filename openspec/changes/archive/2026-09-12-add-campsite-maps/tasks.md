## 1. Dependencies + setup

- [x] 1.1 `cd fargopolis-web && pnpm add leaflet react-leaflet && pnpm add -D @types/leaflet`. (Used `react-leaflet@^4.2.1`, not the latest `5.x` — v5 requires React 19 and this app is on React 18.3.1; v4.2.1 targets React 18 with no peer-dependency warnings.)
- [x] 1.2 Import `leaflet/dist/leaflet.css` once (app entry or the map base module). (In `src/main.tsx`, alongside the existing `react-toastify` CSS import.)
- [x] 1.3 Check for a `Content-Security-Policy` (index.html meta or CloudFront headers). If present, allow `https://*.tile.openstreetmap.org` in `img-src`; if absent, note it in the PR description. (No CSP anywhere — no meta tag in `index.html`, no CloudFront response-headers policy in `frontend-stack.ts`. Noted for the PR description; no code change needed.)
- [x] 1.4 Add `fargopolis-web/src/components/camping/helpers/mapMarker.ts` — a bundler-safe marker icon (explicit `L.icon` from Vite asset imports, or an `L.divIcon` in the app palette). (Used an inline SVG `L.divIcon` in the ember palette — avoids shipping Leaflet's default marker PNGs.)

## 2. Shared map base

- [x] 2.1 Add `fargopolis-web/src/components/camping/CampsiteMapBase.tsx` — wraps `MapContainer` with the OSM `TileLayer` + attribution, a `height` prop, `scrollWheelZoom={false}`, and the shared marker icon.

## 3. Catalog-wide map

- [x] 3.1 Add `fargopolis-web/src/components/camping/CampsiteMap.tsx` — markers for campsites with in-range finite `lat`/`lng`; `fitBounds` to all markers with a `maxZoom` cap; fallback center + empty-state overlay when none; per-marker popup with the campsite name and a `useNavigate` link to `/camping/:id`. (Bounds-fitting extracted to its own `FitMapBounds.tsx` child component, since `useMap()` must be called from inside `MapContainer`.)
- [x] 3.2 Render `CampsiteMap` above the grid in `fargopolis-web/src/pages/CampingPage.tsx`, passing the SWR campsite list.

## 4. Mini-map + form preview

- [x] 4.1 Add `fargopolis-web/src/components/camping/MiniMap.tsx` — `MiniMap({ lat, lng })`, centered, single marker, ~220px.
- [x] 4.2 Render `MiniMap` in `fargopolis-web/src/pages/CampsiteDetailPage.tsx`.
- [x] 4.3 In `fargopolis-web/src/components/camping/CampsiteForm.tsx`, render `CampsiteMapBase` (~200px) with a marker at the parsed `{lat,lng}` (from `parseCoordinates`) and none while unparsed; recenter on change. (New `CampsiteFormMapPreview.tsx`; recenter extracted to its own `MapRecenter.tsx` child component, using `flyTo` so retyping coordinates pans smoothly instead of remounting the map.)

## 5. Verification

- [x] 5.1 `cd fargopolis-web && pnpm build && pnpm lint` clean; check bundle size delta is roughly Leaflet core (~45 KB gz). (Both clean — `pnpm lint` has 5 pre-existing errors in unrelated `dnd` files. Bundle gzip size grew from 275.73 KB to 321.71 KB, a ~46 KB delta, matching the expected Leaflet core size.)
- [x] 5.2 `pnpm dev` and `pnpm build && pnpm preview`: markers render (no broken icon), catalog map frames all pins, marker popup navigates to detail, mini-map centers correctly, form preview pin tracks pasted coordinates. (Verified all of these with Playwright against both `pnpm dev` and the built `pnpm preview` output, using mocked API responses: real OSM tiles rendered — this sandbox has outbound network access — markers show the divIcon pin with no broken-image icon, the catalog map fit both markers in view, clicking a marker popup's "View campsite →" navigated to `/camping/:id` on both dev and preview, the mini-map centered on the campsite, and the form preview pin appeared/moved/disappeared correctly as coordinates were typed/cleared.)
- [x] 5.3 Offline check: block tile requests and confirm the catalog list and detail content still render and are interactive. (Blocked `https://*.tile.openstreetmap.org/**`; the map area degrades to blank grey tiles while the marker, attribution, and zoom controls still render, and the catalog list/"Add a campsite" button remain fully interactive.)
- [x] 5.4 Confirm OpenStreetMap attribution is visible on every map. (Visible in the catalog map, mini-map, and form preview screenshots.)
- [x] 5.5 Run `openspec validate add-campsite-maps --strict`. (`Change 'add-campsite-maps' is valid`.)
