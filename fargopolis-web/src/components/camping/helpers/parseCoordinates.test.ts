import { describe, expect, it } from "vitest";
import { parseCoordinates } from "./parseCoordinates";

function expectOk(input: string, lat: number, lng: number) {
    const result = parseCoordinates(input);
    expect(result).toEqual({ ok: true, value: { lat, lng } });
}

function expectError(input: string, fragment: string) {
    const result = parseCoordinates(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
        expect(result.error).toContain(fragment);
    }
}

describe("parseCoordinates", () => {
    it("parses comma-separated decimal degrees", () => {
        expectOk("44.63, -110.72", 44.63, -110.72);
    });

    it("parses whitespace-separated decimal degrees", () => {
        expectOk("44.63 -110.72", 44.63, -110.72);
    });

    it("applies hemisphere letters and strips degree symbols", () => {
        expectOk("44.63° N, 110.72° W", 44.63, -110.72);
    });

    it("uses hemisphere letters to decide which value is latitude", () => {
        expectOk("110.72W 44.63N", 44.63, -110.72);
    });

    it("rejects empty input", () => {
        expectError("", "Enter coordinates");
    });

    it("rejects the wrong number of values", () => {
        expectError("1, 2, 3", "Enter two values");
    });

    it("rejects non-numeric values", () => {
        expectError("abc, 1", "Could not read");
    });

    it("rejects out-of-range latitude", () => {
        expectError("91, 0", "Latitude must be between -90 and 90");
    });

    it("rejects out-of-range longitude", () => {
        expectError("0, 181", "Longitude must be between -180 and 180");
    });
});
