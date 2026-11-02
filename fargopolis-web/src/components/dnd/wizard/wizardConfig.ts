import { ABILITY_KEYS, AbilityKey, SkillKey } from "@/constants/Skills";
import { DefaultValues, FieldPath } from "react-hook-form";

/** Form values span all four wizard steps. Number inputs register as strings. */
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
}

export const WIZARD_DEFAULTS: DefaultValues<CharacterWizardValues> = {
    level: 1,
    race: "",
    subrace: "",
    className: "",
    subclassName: "",
    savingThrowProficiencies: [],
    skillProficiencies: [],
};

export interface WizardStep {
    label: string;
    title: string;
    hint: string;
    fields: FieldPath<CharacterWizardValues>[];
}

export const STEPS: WizardStep[] = [
    {
        label: "Identity",
        title: "Identity & Background",
        hint: "Name your hero and choose their lineage and calling.",
        fields: ["name", "level", "race", "subrace", "className", "subclassName"],
    },
    {
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
        label: "Combat",
        title: "Combat & Proficiencies",
        hint: "Record combat stats and what your character is trained in.",
        fields: ["hitPoints.max", "armorClass", "initiativeBonus", "speed", "savingThrowProficiencies", "skillProficiencies"],
    },
    {
        label: "Review",
        title: "Review & Confirm",
        hint: "Everything is saved. Check it over, then finish.",
        fields: [],
    },
];

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
