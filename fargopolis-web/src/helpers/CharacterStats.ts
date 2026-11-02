import Character from "@/models/Character";

/**
 * The detail page uses raw API JSON (not the `Character` constructor), and the
 * API doesn't return stat fields yet. Fill in the constructor's defaults so the
 * stat/proficiency displays never read a missing field.
 */
export function withStatDefaults(c: Character): Character {
    // The API doesn't guarantee these are populated yet, even though `Character` types them
    // as required — cast to Partial so a missing key falls back to its default below instead
    // of TS treating the object-spread default as dead code (TS2783).
    const abilityScores = c.abilityScores as Partial<Character["abilityScores"]> | undefined;
    const hitPoints = c.hitPoints as Partial<Character["hitPoints"]> | undefined;
    return {
        ...c,
        abilityScores: {
            str: abilityScores?.str ?? 10,
            dex: abilityScores?.dex ?? 10,
            con: abilityScores?.con ?? 10,
            int: abilityScores?.int ?? 10,
            wis: abilityScores?.wis ?? 10,
            cha: abilityScores?.cha ?? 10,
        },
        hitPoints: {
            current: hitPoints?.current ?? 0,
            max: hitPoints?.max ?? 0,
            temp: hitPoints?.temp ?? 0,
        },
        armorClass: c.armorClass ?? 10,
        initiativeBonus: c.initiativeBonus ?? 0,
        speed: c.speed ?? 30,
        savingThrowProficiencies: Array.isArray(c.savingThrowProficiencies) ? c.savingThrowProficiencies : [],
        skillProficiencies: Array.isArray(c.skillProficiencies) ? c.skillProficiencies : [],
    };
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
