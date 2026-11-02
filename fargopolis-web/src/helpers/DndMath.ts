export const abilityModifier = (score: number) => Math.floor((score - 10) / 2);

export const proficiencyBonusForLevel = (level: number) => {
    const clamped = Math.min(20, Math.max(1, level));
    return Math.ceil(clamped / 4) + 1;
};

export const formatModifier = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export const checkModifier = (abilityScore: number, proficiencyBonus: number, isProficient: boolean) =>
    abilityModifier(abilityScore) + (isProficient ? proficiencyBonus : 0);
