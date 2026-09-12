/** One recorded stay at a campsite. Dates are ISO date strings ("YYYY-MM-DD"), not timestamps. */
export default interface Visit {
    visitId: string;
    startDate: string;
    /** Absent means a single night. */
    endDate?: string | null;
    people: string[];
    notes: string;
    weather?: string | null;
    /** Overall feel of the stay, 1–5. */
    rating?: number | null;
    /** Ordered file ids of photos attached to this visit. */
    photoIds: string[];
}
