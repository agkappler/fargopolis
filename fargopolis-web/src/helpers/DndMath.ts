export function abilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

// Levels 1-4 → +2, 5-8 → +3, 9-12 → +4, 13-16 → +5, 17+ → +6.
export function proficiencyBonusForLevel(level: number): number {
    if (!Number.isFinite(level)) return 2;
    const clamped = Math.min(20, Math.max(1, Math.floor(level)));
    return Math.floor((clamped - 1) / 4) + 2;
}

// "+3" / "-1" / "+0". Negative zero formats as "+0".
export function formatModifier(n: number): string {
    return n >= 0 ? `+${Math.abs(n)}` : `${n}`;
}

// Total modifier for a saving throw or skill check.
export function checkModifier(abilityScore: number, proficiencyBonus: number, isProficient: boolean): number {
    const mod = abilityModifier(abilityScore);
    return isProficient ? mod + proficiencyBonus : mod;
}
