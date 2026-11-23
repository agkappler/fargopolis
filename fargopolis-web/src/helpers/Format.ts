export function formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
}

/** Uppercase the first character. Drop-in replacement for MUI's `capitalize`. */
export function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Turn a dnd5eapi-style index into a display name: "wood-elf" → "Wood Elf". */
export function formatIndexName(value?: string | null): string {
    if (!value) return "";
    return value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map(w => capitalize(w.toLowerCase()))
        .join(" ");
}

/** Race label for a character subtitle: "Wood Elf", "Dwarf (Hill)", or just "Human". */
export function formatRaceLabel(race?: string, subrace?: string): string {
    const raceName = formatIndexName(race);
    const subraceName = formatIndexName(subrace);
    if (!subraceName) return raceName;
    // A subrace like "Wood Elf" already names its race; "Elf (Wood Elf)" would repeat it.
    if (raceName && subraceName.toLowerCase().includes(raceName.toLowerCase())) return subraceName;
    return raceName ? `${raceName} (${subraceName})` : subraceName;
}
