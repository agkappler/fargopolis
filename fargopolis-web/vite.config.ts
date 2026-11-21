import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Keep in sync with the hand-added `theme-color` meta tag in index.html.
const THEME_COLOR = "#1c1a17";
const BACKGROUND_COLOR = "#4338CA";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Only the shell-relevant images are precached; the unrelated brand/about
      // photos in public/ are intentionally left out of the service worker cache.
      includeAssets: ["icon.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "Fargopolis",
        short_name: "Fargopolis",
        description: "Fargopolis personal tools, installable to your home screen",
        // Launching the installed icon opens straight to Quests; scope stays
        // "/" so the rest of the app is still reachable without browser chrome.
        start_url: "/quests",
        scope: "/",
        display: "standalone",
        background_color: BACKGROUND_COLOR,
        theme_color: THEME_COLOR,
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        // Narrow, explicit glob: only the build's own JS/CSS/HTML output is
        // precached (not the plugin's broader image-inclusive default).
        globPatterns: ["**/*.{js,css,html}"],
        // Any same-origin navigation that isn't an exact precache hit (e.g. a
        // client-side route reopened or reloaded offline) falls back to the
        // cached app shell instead of failing.
        navigateFallback: "/index.html",
        // Defensive only: RequestManager calls a separate, cross-origin
        // VITE_API_URL, so this never matches today. Kept as insurance against
        // a future same-origin `/api` path being added.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
