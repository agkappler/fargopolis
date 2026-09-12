import L from "leaflet";

/**
 * An inline SVG pin in the app's ember palette, built via `L.divIcon` rather
 * than Leaflet's default `L.icon` — the default icon resolves its PNGs via
 * CSS-relative URLs that break under Vite's bundling, and a divIcon avoids
 * shipping (or working around) those images entirely.
 */
const PIN_SVG = `
<svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 23 13 23s13-13.3 13-23C26 5.8 20.2 0 13 0z" fill="#c25a30" stroke="#6b321a" stroke-width="1"/>
  <circle cx="13" cy="13" r="5" fill="#fdfbf6"/>
</svg>`.trim();

export const campsiteMarkerIcon = L.divIcon({
    className: "campsite-marker-icon",
    html: PIN_SVG,
    iconSize: [26, 36],
    iconAnchor: [13, 36],
    popupAnchor: [0, -32],
});
