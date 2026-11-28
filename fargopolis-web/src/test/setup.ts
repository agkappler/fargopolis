// Shared setup for component tests. There is no vitest config file, so each component
// test opts in with a `// @vitest-environment jsdom` docblock and `import "@/test/setup";`.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
    cleanup(); // needed because Vitest globals stay off
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

// jsdom gaps that Chakra v3 (Ark/zag) relies on. No-op stubs, added only if missing.
class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
}
if (!("ResizeObserver" in globalThis)) {
    globalThis.ResizeObserver = NoopObserver as unknown as typeof ResizeObserver;
}
if (!("IntersectionObserver" in globalThis)) {
    globalThis.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver;
}
if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
}
// Newer Node versions ship their own global `localStorage`/`Storage` (undefined without
// --localstorage-file), which shadow jsdom's. Point them back at the jsdom window's.
const jsdomWindow = (globalThis as { jsdom?: { window?: Window & typeof globalThis } }).jsdom?.window;
if (jsdomWindow) {
    for (const name of ["localStorage", "sessionStorage", "Storage"] as const) {
        Object.defineProperty(globalThis, name, {
            configurable: true,
            writable: true,
            value: jsdomWindow[name],
        });
    }
}
if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = (() => {}) as unknown as typeof Element.prototype.scrollTo;
}
