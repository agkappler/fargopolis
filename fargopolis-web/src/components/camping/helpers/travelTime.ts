/**
 * Parse a drive-time string into whole minutes.
 *
 * Accepts `"2h 15m"`, `"2h"`, `"90m"`, `"1:30"`, or a bare number of minutes.
 * Returns `null` for empty input and `undefined` for anything unparseable.
 */
export function parseTravelTimeMinutes(input: string | number | null | undefined): number | null | undefined {
    if (input === null || input === undefined || input === "") {
        return null;
    }
    if (typeof input === "number") {
        return Number.isFinite(input) && input >= 0 ? Math.round(input) : undefined;
    }

    const text = input.trim().toLowerCase();
    if (!text) {
        return null;
    }

    const clock = text.match(/^(\d+):([0-5]?\d)$/);
    if (clock) {
        return Number(clock[1]) * 60 + Number(clock[2]);
    }

    const hm = text.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m)?$/);
    if (hm && (hm[1] !== undefined || hm[2] !== undefined)) {
        const hours = hm[1] ? Number(hm[1]) : 0;
        const minutes = hm[2] ? Number(hm[2]) : 0;
        return Math.round(hours * 60 + minutes);
    }

    if (/^\d+(\.\d+)?$/.test(text)) {
        return Math.round(Number(text));
    }

    return undefined;
}

/** Format whole minutes as `"2h 15m"` / `"45m"` / `"3h"`. */
export function formatTravelTime(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined || !Number.isFinite(minutes) || minutes <= 0) {
        return "";
    }
    const whole = Math.round(minutes);
    const hours = Math.floor(whole / 60);
    const mins = whole % 60;
    if (hours === 0) {
        return `${mins}m`;
    }
    if (mins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
}
