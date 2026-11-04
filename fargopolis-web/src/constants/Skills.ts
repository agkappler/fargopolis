export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export const ABILITY_KEYS: readonly AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"] as const;

/**
 * The 18 standard D&D 5e skills and the ability each one keys off.
 * `apiIndex` is the matching dnd5eapi proficiency index (e.g. "skill-sleight-of-hand"),
 * used to scope the Skills wizard step to what a class can actually choose from.
 */
export const SKILLS = [
    { key: "acrobatics", name: "Acrobatics", ability: "dex", apiIndex: "skill-acrobatics" },
    { key: "animalHandling", name: "Animal Handling", ability: "wis", apiIndex: "skill-animal-handling" },
    { key: "arcana", name: "Arcana", ability: "int", apiIndex: "skill-arcana" },
    { key: "athletics", name: "Athletics", ability: "str", apiIndex: "skill-athletics" },
    { key: "deception", name: "Deception", ability: "cha", apiIndex: "skill-deception" },
    { key: "history", name: "History", ability: "int", apiIndex: "skill-history" },
    { key: "insight", name: "Insight", ability: "wis", apiIndex: "skill-insight" },
    { key: "intimidation", name: "Intimidation", ability: "cha", apiIndex: "skill-intimidation" },
    { key: "investigation", name: "Investigation", ability: "int", apiIndex: "skill-investigation" },
    { key: "medicine", name: "Medicine", ability: "wis", apiIndex: "skill-medicine" },
    { key: "nature", name: "Nature", ability: "int", apiIndex: "skill-nature" },
    { key: "perception", name: "Perception", ability: "wis", apiIndex: "skill-perception" },
    { key: "performance", name: "Performance", ability: "cha", apiIndex: "skill-performance" },
    { key: "persuasion", name: "Persuasion", ability: "cha", apiIndex: "skill-persuasion" },
    { key: "religion", name: "Religion", ability: "int", apiIndex: "skill-religion" },
    { key: "sleightOfHand", name: "Sleight of Hand", ability: "dex", apiIndex: "skill-sleight-of-hand" },
    { key: "stealth", name: "Stealth", ability: "dex", apiIndex: "skill-stealth" },
    { key: "survival", name: "Survival", ability: "wis", apiIndex: "skill-survival" },
] as const satisfies readonly { key: string; name: string; ability: AbilityKey; apiIndex: string }[];

export type Skill = (typeof SKILLS)[number];
export type SkillKey = Skill["key"];
