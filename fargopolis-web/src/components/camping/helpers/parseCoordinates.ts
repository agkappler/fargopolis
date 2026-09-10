export interface ParsedCoordinates {
    lat: number;
    lng: number;
}

export type ParseCoordinatesResult =
    | { ok: true; value: ParsedCoordinates }
    | { ok: false; error: string };

const COMPONENT = /^([+-]?\d+(?:\.\d+)?)\s*([NSEW])?$/i;

interface Component {
    magnitude: number;
    signed: number;
    direction: "N" | "S" | "E" | "W" | null;
}

function parseComponent(raw: string): Component | null {
    const match = raw.trim().match(COMPONENT);
    if (!match) {
        return null;
    }
    const signed = Number(match[1]);
    if (!Number.isFinite(signed)) {
        return null;
    }
    const direction = (match[2]?.toUpperCase() ?? null) as Component["direction"];
    return { magnitude: Math.abs(signed), signed, direction };
}

function applyDirection(component: Component): number {
    if (component.direction === "S" || component.direction === "W") {
        return -component.magnitude;
    }
    if (component.direction === "N" || component.direction === "E") {
        return component.magnitude;
    }
    return component.signed;
}

/**
 * Parse a pasted coordinate string into a lat/lng pair.
 *
 * Accepts comma- or whitespace-separated decimal degrees, an optional `°`
 * symbol, and an optional N/S/E/W suffix per component (S/W → negative). When
 * hemisphere letters are present they also decide which value is latitude.
 * Returns an error result for anything unparseable or out of range.
 */
export function parseCoordinates(input: string): ParseCoordinatesResult {
    const cleaned = input.replace(/[°]/g, " ").trim();
    if (!cleaned) {
        return { ok: false, error: "Enter coordinates, e.g. 44.63, -110.72" };
    }

    const parts = (cleaned.includes(",") ? cleaned.split(",") : cleaned.split(/\s+/))
        .map((p) => p.trim())
        .filter(Boolean);
    if (parts.length !== 2) {
        return { ok: false, error: "Enter two values: latitude and longitude" };
    }

    const first = parseComponent(parts[0]);
    const second = parseComponent(parts[1]);
    if (!first || !second) {
        return { ok: false, error: "Could not read those coordinates" };
    }

    let latComponent = first;
    let lngComponent = second;
    const firstIsLat = first.direction === "N" || first.direction === "S";
    const firstIsLng = first.direction === "E" || first.direction === "W";
    const secondIsLat = second.direction === "N" || second.direction === "S";
    if (firstIsLng || secondIsLat) {
        latComponent = second;
        lngComponent = first;
    } else if (firstIsLat) {
        latComponent = first;
        lngComponent = second;
    }

    const lat = applyDirection(latComponent);
    const lng = applyDirection(lngComponent);

    if (lat < -90 || lat > 90) {
        return { ok: false, error: "Latitude must be between -90 and 90" };
    }
    if (lng < -180 || lng > 180) {
        return { ok: false, error: "Longitude must be between -180 and 180" };
    }

    return { ok: true, value: { lat, lng } };
}
