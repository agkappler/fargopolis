## 1. Dependencies + setup

- [ ] 1.1 `cd fargopolis-web && pnpm add leaflet react-leaflet && pnpm add -D @types/leaflet`.
- [ ] 1.2 Import `leaflet/dist/leaflet.css` once (app entry or the map base module).
- [ ] 1.3 Check for a `Content-Security-Policy` (index.html meta or CloudFront headers). If present, allow `https://*.tile.openstreetmap.org` in `img-src`; if absent, note it in the PR description.
- [ ] 1.4 Add `fargopolis-web/src/components/camping/helpers/mapMarker.ts` — a bundler-safe marker icon (explicit `L.icon` from Vite asset imports, or an `L.divIcon` in the app palette).

## 2. Shared map base

- [ ] 2.1 Add `fargopolis-web/src/components/camping/CampsiteMapBase.tsx` — wraps `MapContainer` with the OSM `TileLayer` + attribution, a `height` prop, `scrollWheelZoom={false}`, and the shared marker icon.

## 3. Catalog-wide map

- [ ] 3.1 Add `fargopolis-web/src/components/camping/CampsiteMap.tsx` — markers for campsites with in-range finite `lat`/`lng`; `fitBounds` to all markers with a `maxZoom` cap; fallback center + empty-state overlay when none; per-marker popup with the campsite name and a `useNavigate` link to `/camping/:id`.
- [ ] 3.2 Render `CampsiteMap` above the grid in `fargopolis-web/src/pages/CampingPage.tsx`, passing the SWR campsite list.

## 4. Mini-map + form preview

- [ ] 4.1 Add `fargopolis-web/src/components/camping/MiniMap.tsx` — `MiniMap({ lat, lng })`, centered, single marker, ~220px.
- [ ] 4.2 Render `MiniMap` in `fargopolis-web/src/pages/CampsiteDetailPage.tsx`.
- [ ] 4.3 In `fargopolis-web/src/components/camping/CampsiteForm.tsx`, render `CampsiteMapBase` (~200px) with a marker at the parsed `{lat,lng}` (from `parseCoordinates`) and none while unparsed; recenter on change.

## 5. Verification

- [ ] 5.1 `cd fargopolis-web && pnpm build && pnpm lint` clean; check bundle size delta is roughly Leaflet core (~45 KB gz).
- [ ] 5.2 `pnpm dev` and `pnpm build && pnpm preview`: markers render (no broken icon), catalog map frames all pins, marker popup navigates to detail, mini-map centers correctly, form preview pin tracks pasted coordinates.
- [ ] 5.3 Offline check: block tile requests and confirm the catalog list and detail content still render and are interactive.
- [ ] 5.4 Confirm OpenStreetMap attribution is visible on every map.
- [ ] 5.5 Run `openspec validate add-campsite-maps --strict`.
