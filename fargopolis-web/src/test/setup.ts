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
if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = (() => {}) as unknown as typeof Element.prototype.scrollTo;
}
