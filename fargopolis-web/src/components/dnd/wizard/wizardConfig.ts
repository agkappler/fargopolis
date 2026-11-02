import { Spell, Spellcasting } from "@/api/dnd5eapi";
import { ABILITY_KEYS, AbilityKey, SkillKey } from "@/constants/Skills";
import { DefaultValues, FieldPath } from "react-hook-form";

/** Form values span all wizard steps. Number inputs register as strings. */
export interface CharacterWizardValues {
    name: string;
    level: number | string;
    race: string;
    subrace: string;
    className: string;
    subclassName: string;
    abilityScores: Record<AbilityKey, number | string>;
    hitPoints: { max: number | string };
    armorClass: number | string;
    initiativeBonus: number | string;
    speed: number | string;
    savingThrowProficiencies: AbilityKey[];
    skillProficiencies: SkillKey[];
    /** STARTING_WEAPONS key; "" means none. Saved via /addWeapon, never sent to /updateCharacter. */
    startingWeapon: string;
    /** Pending spell selection. Saved via addKnownSpell, never sent to /updateCharacter. */
    knownSpells: Spell[];
}

export const WIZARD_DEFAULTS: DefaultValues<CharacterWizardValues> = {
    level: 1,
    race: "",
    subrace: "",
    className: "",
    subclassName: "",
    savingThrowProficiencies: [],
    skillProficiencies: [],
    startingWeapon: "",
    knownSpells: [],
};

export type StepId = "identity" | "abilities" | "combat" | "weapon" | "spells" | "review";

export interface WizardStep {
    id: StepId;
    label: string;
    title: string;
    hint: string;
    fields: FieldPath<CharacterWizardValues>[];
    /** Optional steps show a "Skip for now" action. */
    optional?: boolean;
}

export const STEPS: WizardStep[] = [
    {
        id: "identity",
        label: "Identity",
        title: "Identity & Background",
        hint: "Name your hero and choose their lineage and calling.",
        fields: ["name", "level", "race", "subrace", "className", "subclassName"],
    },
    {
        id: "abilities",
        label: "Abilities",
        title: "Ability Scores",
        hint: "Set the six core abilities, or start from the standard array.",
        fields: [
            "abilityScores.str",
            "abilityScores.dex",
            "abilityScores.con",
            "abilityScores.int",
            "abilityScores.wis",
            "abilityScores.cha",
        ],
    },
    {
        id: "combat",
        label: "Combat",
        title: "Combat & Proficiencies",
        hint: "Record combat stats and what your character is trained in.",
        fields: ["hitPoints.max", "armorClass", "initiativeBonus", "speed", "savingThrowProficiencies", "skillProficiencies"],
    },
    {
        id: "weapon",
        label: "Weapon",
        title: "Starting Weapon",
        hint: "Pick a weapon to start with, or skip and add one later.",
        fields: [],
        optional: true,
    },
    {
        id: "spells",
        label: "Spells",
        title: "Known Spells",
        hint: "Choose a few starting spells from your class list.",
        fields: [],
        optional: true,
    },
    {
        id: "review",
        label: "Review",
        title: "Review & Confirm",
        hint: "Everything is saved. Check it over, then finish.",
        fields: [],
    },
];

/** Steps for the chosen class. The Spells step is dropped only once we know the class can't cast. */
export function getEffectiveSteps(isCaster: boolean | undefined): WizardStep[] {
    return isCaster === false ? STEPS.filter(s => s.id !== "spells") : STEPS;
}

export const STARTING_WEAPONS = [
    { key: "longsword", name: "Longsword", damage: "1d8", damageType: "slashing", range: "Melee (5 ft)", description: "Versatile (1d10)" },
    { key: "shortbow", name: "Shortbow", damage: "1d6", damageType: "piercing", range: "80/320 ft", description: "Ammunition, two-handed" },
    { key: "dagger", name: "Dagger", damage: "1d4", damageType: "piercing", range: "Melee or thrown 20/60 ft", description: "Finesse, light, thrown" },
    { key: "quarterstaff", name: "Quarterstaff", damage: "1d6", damageType: "bludgeoning", range: "Melee (5 ft)", description: "Versatile (1d8)" },
] as const;

export type StartingWeapon = (typeof STARTING_WEAPONS)[number];

/** Spell levels the character can pick from (0 = cantrips). Same rule as SpellInfo.tsx. */
export function castableSpellLevels(sc?: Spellcasting): number[] {
    if (!sc) return [];
    const levels: number[] = [];
    if (sc.cantrips_known > 0) levels.push(0);
    for (let n = 1; n <= 9; n++) {
        const slots = sc[`spell_slots_level_${n}` as keyof Spellcasting];
        if (typeof slots === "number" && slots > 0) levels.push(n);
    }
    return levels;
}

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const ABILITY_LABELS: Record<AbilityKey, string> = {
    str: "STR",
    dex: "DEX",
    con: "CON",
    int: "INT",
    wis: "WIS",
    cha: "CHA",
};

const isFilled = (v: unknown) => v !== undefined && v !== null && v !== "";

/** Builds the full payload of everything entered so far (the update route overwrites, it doesn't patch). */
export function buildPayload(values: Partial<CharacterWizardValues>, characterId?: string) {
    const payload: Record<string, unknown> = {
        name: values.name,
        level: Number(values.level),
        race: values.race,
        subrace: values.subrace ?? "",
        className: values.className,
        subclassName: values.subclassName ?? "",
        savingThrowProficiencies: values.savingThrowProficiencies ?? [],
        skillProficiencies: values.skillProficiencies ?? [],
    };

    const scores = values.abilityScores;
    if (scores && ABILITY_KEYS.every(k => isFilled(scores[k]))) {
        payload.abilityScores = Object.fromEntries(ABILITY_KEYS.map(k => [k, Number(scores[k])]));
    }

    const maxHp = values.hitPoints?.max;
    if (isFilled(maxHp)) {
        const m = Number(maxHp);
        payload.hitPoints = { max: m, current: m, temp: 0 };
    }

    if (isFilled(values.armorClass)) payload.armorClass = Number(values.armorClass);
    if (isFilled(values.initiativeBonus)) payload.initiativeBonus = Number(values.initiativeBonus);
    if (isFilled(values.speed)) payload.speed = Number(values.speed);

    if (characterId) payload.characterId = characterId;
    return payload;
}
