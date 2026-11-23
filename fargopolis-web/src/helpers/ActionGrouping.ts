import type { LevelInfo, SpellDetails } from "@/api/dnd5eapi";
import { ABILITY_SOURCE_ORDER, UsageType } from "@/constants/Abilities";
import Ability from "@/models/Ability";
import Character from "@/models/Character";
import KnownSpell from "@/models/KnownSpell";
import Weapon from "@/models/Weapon";
import { weaponAttack } from "./WeaponAttack";

export type EconomySection = "action" | "bonus" | "reaction" | "passive";

export const SECTION_ORDER: readonly EconomySection[] = ["action", "bonus", "reaction", "passive"];

export const SECTION_LABELS: Readonly<Record<EconomySection, string>> = {
    action: "Action",
    bonus: "Bonus Action",
    reaction: "Reaction",
    passive: "Passive & Free",
};

export type ActionRow =
    | { kind: "weapon"; id: string; weapon: Weapon }
    | { kind: "opportunity"; id: string; weapon: Weapon }
    | { kind: "spell"; id: string; knownSpell: KnownSpell; details?: SpellDetails }
    | { kind: "ability"; id: string; ability: Ability };

export interface SectionGroups {
    weapons: ActionRow[];
    spells: ActionRow[];
    abilities: ActionRow[];
}

export type GroupedActions = Record<EconomySection, SectionGroups>;

export function sectionForUsage(usage: UsageType | string | undefined): EconomySection {
    switch (usage) {
        case UsageType.BonusAction: return "bonus";
        case UsageType.Reaction: return "reaction";
        case UsageType.FreeAction:
        case UsageType.Passive: return "passive";
        case UsageType.Action:
        default: return "action";
    }
}

/**
 * Spells sort by casting time: bonus action / reaction get their own sections; "1 action" and
 * longer casts ("1 minute", "1 hour") go in Action — they still take your actions. Unknown → Action.
 */
export function sectionForCastingTime(castingTime?: string | null): EconomySection {
    const t = (castingTime ?? "").toLowerCase();
    if (t.includes("bonus action")) return "bonus";
    if (t.includes("reaction")) return "reaction";
    return "action";
}

/** True for the plain economy casting times that the section header already says. */
export function isStandardCastingTime(castingTime?: string | null): boolean {
    const t = (castingTime ?? "").trim().toLowerCase();
    return t === "" || t === "1 action" || t.startsWith("1 bonus action") || t.startsWith("1 reaction");
}

const emptyGroups = (): GroupedActions => ({
    action: { weapons: [], spells: [], abilities: [] },
    bonus: { weapons: [], spells: [], abilities: [] },
    reaction: { weapons: [], spells: [], abilities: [] },
    passive: { weapons: [], spells: [], abilities: [] },
});

const sourceRank = (a: Ability) => {
    const i = ABILITY_SOURCE_ORDER.indexOf(a.source);
    return i === -1 ? ABILITY_SOURCE_ORDER.length : i;
};

interface GroupActionsInput {
    weapons?: Weapon[];
    knownSpells?: KnownSpell[];
    /** Keyed by spellKey (dnd5eapi index). */
    spellDetails?: Record<string, SpellDetails | undefined>;
    abilities?: Ability[];
    /** Only used for weapon melee detection (ability scores don't matter for that). */
    character?: Character;
    includeOpportunityAttack?: boolean;
}

const NEUTRAL_CHARACTER = { level: 1 } as Character;

export function groupActions({
    weapons = [],
    knownSpells = [],
    spellDetails = {},
    abilities = [],
    character = NEUTRAL_CHARACTER,
    includeOpportunityAttack = true,
}: GroupActionsInput): GroupedActions {
    const grouped = emptyGroups();

    for (const weapon of weapons) {
        grouped.action.weapons.push({ kind: "weapon", id: `weapon-${weapon.weaponId}`, weapon });
    }
    if (includeOpportunityAttack) {
        const melee = weapons.find(w => weaponAttack(w, character).isMelee);
        if (melee) grouped.reaction.weapons.push({ kind: "opportunity", id: `opportunity-${melee.weaponId}`, weapon: melee });
    }

    const spells = [...knownSpells].sort((a, b) =>
        (a.spellLevel ?? 0) - (b.spellLevel ?? 0) || (a.spellName ?? "").localeCompare(b.spellName ?? ""));
    const seen: Record<string, number> = {};
    spells.forEach(knownSpell => {
        // A spell known from two sources would otherwise produce duplicate React keys.
        const n = (seen[knownSpell.spellKey] = (seen[knownSpell.spellKey] ?? 0) + 1);
        const details = spellDetails[knownSpell.spellKey];
        const section = sectionForCastingTime(details?.casting_time);
        grouped[section].spells.push({ kind: "spell", id: n === 1 ? `spell-${knownSpell.spellKey}` : `spell-${knownSpell.spellKey}-${n}`, knownSpell, details });
    });

    const sortedAbilities = [...abilities].sort((a, b) =>
        sourceRank(a) - sourceRank(b) || (a.name ?? "").localeCompare(b.name ?? ""));
    for (const ability of sortedAbilities) {
        grouped[sectionForUsage(ability.usage)].abilities.push({ kind: "ability", id: `ability-${ability.abilityId}`, ability });
    }

    return grouped;
}

export function sectionSize(groups: SectionGroups): number {
    return groups.weapons.length + groups.spells.length + groups.abilities.length;
}

export function sectionCounts(grouped: GroupedActions): Record<EconomySection | "all", number> {
    const counts = {
        action: sectionSize(grouped.action),
        bonus: sectionSize(grouped.bonus),
        reaction: sectionSize(grouped.reaction),
        passive: sectionSize(grouped.passive),
    };
    return { ...counts, all: counts.action + counts.bonus + counts.reaction + counts.passive };
}

/** Attacks per Attack action: fighter's `extra_attacks`, any Extra Attack feature/ability, else 1. */
export function attacksPerAction(levelInfos: LevelInfo[] | undefined, level: number, abilities: Ability[] = []): number {
    const infos = Array.isArray(levelInfos) ? levelInfos : [];
    const extra = infos.find(l => l.level === level)?.class_specific?.extra_attacks;
    if (typeof extra === "number" && extra > 0) return 1 + extra;
    const hasFeature = infos.some(l =>
        l.level <= level && (l.features ?? []).some(f => f.index?.startsWith("extra-attack")));
    if (hasFeature || abilities.some(a => /extra attack/i.test(a.name ?? ""))) return 2;
    return 1;
}

export function sectionHint(section: EconomySection, attacks: number): string | undefined {
    switch (section) {
        case "action": return attacks > 1 ? `Extra Attack: attack ${attacks}× when you take the Attack action` : undefined;
        case "bonus": return "One per turn";
        case "reaction": return "One per round";
        case "passive": return "No action needed";
    }
}

/** Abilities that spend a spell slot (e.g. Divine Smite). */
export function abilityUsesSlot(ability: Ability): boolean {
    const re = /spell slot|\bslot\b/i;
    if (ability.recovery?.trim()) return re.test(ability.recovery);
    return re.test(ability.description ?? "");
}

export function abilityRecoveryTag(ability: Ability): string {
    const recovery = ability.recovery?.trim();
    if (recovery) return recovery;
    return ability.usage === UsageType.Passive ? "Passive" : "At will";
}
