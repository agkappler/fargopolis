export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export const ABILITY_KEYS: readonly AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"] as const;

export const SKILLS = [
    { key: "acrobatics", name: "Acrobatics", ability: "dex" },
    { key: "animalHandling", name: "Animal Handling", ability: "wis" },
    { key: "arcana", name: "Arcana", ability: "int" },
    { key: "athletics", name: "Athletics", ability: "str" },
    { key: "deception", name: "Deception", ability: "cha" },
    { key: "history", name: "History", ability: "int" },
    { key: "insight", name: "Insight", ability: "wis" },
    { key: "intimidation", name: "Intimidation", ability: "cha" },
    { key: "investigation", name: "Investigation", ability: "int" },
    { key: "medicine", name: "Medicine", ability: "wis" },
    { key: "nature", name: "Nature", ability: "int" },
    { key: "perception", name: "Perception", ability: "wis" },
    { key: "performance", name: "Performance", ability: "cha" },
    { key: "persuasion", name: "Persuasion", ability: "cha" },
    { key: "religion", name: "Religion", ability: "int" },
    { key: "sleightOfHand", name: "Sleight of Hand", ability: "dex" },
    { key: "stealth", name: "Stealth", ability: "dex" },
    { key: "survival", name: "Survival", ability: "wis" },
] as const satisfies readonly { key: string; name: string; ability: AbilityKey }[];

export type Skill = (typeof SKILLS)[number];
export type SkillKey = Skill["key"];
