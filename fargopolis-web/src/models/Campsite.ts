import Visit from "@/models/Visit";

/**
 * One physical place we have camped. Place-centric: trip history (`visits`),
 * photo references, and the cover photo are populated by later changes.
 */
export default interface Campsite {
    campsiteId: string;
    name: string;
    lat: number;
    lng: number;
    region?: string | null;
    park?: string | null;
    /** Drive time from home, in whole minutes. */
    travelTimeMinutes?: number | null;
    /** Link to a The Dyrt listing for this site. */
    dyrtUrl?: string | null;
    /** true / false / null (unknown). */
    firepit?: boolean | null;
    /** 1–5 ratings describing the site itself. */
    views?: number | null;
    privacy?: number | null;
    space?: number | null;
    notes?: string | null;

    // Populated by later changes; optional here so the model does not reshape.
    coverPhotoId?: string | null;
    visitCount?: number;
    lastVisitDate?: string | null;
    /** Full trip history, newest first. Present on the single-campsite response, absent on list entries. */
    visits?: Visit[];
}
