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

// Passive score (e.g. Passive Perception): 10 + the check modifier.
export function passiveScore(abilityScore: number, proficiencyBonus: number, isProficient: boolean): number {
    return 10 + checkModifier(abilityScore, proficiencyBonus, isProficient);
}

export type SpellcastingAbility = "int" | "wis" | "cha";

/**
 * Standard 5e spellcasting ability per class, keyed by the lowercase dnd5eapi class index
 * (how `character.className` is stored). Barbarian, Fighter, Monk and Rogue have none.
 * Half-casters (Paladin, Ranger) are listed regardless of level, so their spell rows show at
 * level 1 too, even though they can't cast until level 2.
 */
export const SPELLCASTING_ABILITY_BY_CLASS: Readonly<Record<string, SpellcastingAbility>> = {
    bard: "cha",
    paladin: "cha",
    sorcerer: "cha",
    warlock: "cha",
    cleric: "wis",
    druid: "wis",
    ranger: "wis",
    wizard: "int",
    artificer: "int",
};

/** The class's spellcasting ability (case-insensitive), or undefined for non-casters and unknown classes. */
export function spellcastingAbilityForClass(className?: string | null): SpellcastingAbility | undefined {
    const key = className?.trim().toLowerCase();
    if (!key) return undefined;
    return Object.prototype.hasOwnProperty.call(SPELLCASTING_ABILITY_BY_CLASS, key)
        ? SPELLCASTING_ABILITY_BY_CLASS[key]
        : undefined;
}

// Spell save DC: 8 + proficiency bonus + spellcasting ability modifier.
export function spellSaveDc(abilityScore: number, proficiencyBonus: number): number {
    return 8 + proficiencyBonus + abilityModifier(abilityScore);
}

// Spell attack bonus: proficiency bonus + spellcasting ability modifier.
export function spellAttackBonus(abilityScore: number, proficiencyBonus: number): number {
    return proficiencyBonus + abilityModifier(abilityScore);
}
