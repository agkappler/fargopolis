function parseIsoDate(value: string): Date | null {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a visit's stay as a friendly range: `"Sep 1–4, 2025"` or `"Sep 1, 2025 · one night"`. */
export function formatVisitDateRange(startDate: string, endDate?: string | null): string {
    const start = parseIsoDate(startDate);
    if (!start) return startDate;
    const startFull = start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

    if (!endDate || endDate === startDate) {
        return `${startFull} · one night`;
    }

    const end = parseIsoDate(endDate);
    if (!end) return startFull;

    const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
    if (sameMonth) {
        const startShort = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return `${startShort}–${end.getDate()}, ${end.getFullYear()}`;
    }
    const endFull = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${startFull} – ${endFull}`;
}
