import type { LevelInfo, SpellDetails } from "@/api/dnd5eapi";
import { AbilitySource, UsageType } from "@/constants/Abilities";
import Ability from "@/models/Ability";
import KnownSpell from "@/models/KnownSpell";
import Weapon from "@/models/Weapon";
import { describe, expect, it } from "vitest";
import {
    abilityRecoveryTag,
    abilityUsesSlot,
    attacksPerAction,
    groupActions,
    sectionCounts,
    sectionForCastingTime,
    sectionForUsage,
    sectionHint,
} from "./ActionGrouping";

const weapon = (weaponId: string, name: string, range: string, damage = "1d8"): Weapon =>
    ({ weaponId, characterId: "c", name, damage, range, damageType: "piercing", description: "" });
const spell = (spellKey: string, spellName: string, spellLevel: number): KnownSpell =>
    ({ spellKey, spellName, spellLevel, characterId: "c" });
const details = (index: string, name: string, level: number, casting_time: string, concentration = false): SpellDetails =>
    ({ index, name, url: "", level, casting_time, concentration, ritual: false, range: "60 feet", duration: "Instantaneous" });
const ability = (abilityId: string, name: string, usage: UsageType, fields: Partial<Ability> = {}): Ability =>
    ({ abilityId, characterId: "c", name, description: "", source: AbilitySource.Class, sourceDescription: "", usage, recovery: "", ...fields });

const longsword = weapon("w1", "Longsword", "5 ft");
const longbow = weapon("w2", "Longbow", "80/320");

const knownSpells = [
    spell("shield", "Shield", 1),
    spell("healing-word", "Healing Word", 1),
    spell("cure-wounds", "Cure Wounds", 1),
    spell("fire-bolt", "Fire Bolt", 0),
];
const spellDetails = {
    "shield": details("shield", "Shield", 1, "1 reaction, which you take when you are hit by an attack"),
    "healing-word": details("healing-word", "Healing Word", 1, "1 bonus action"),
    "cure-wounds": details("cure-wounds", "Cure Wounds", 1, "1 action"),
    "fire-bolt": details("fire-bolt", "Fire Bolt", 0, "1 action"),
};
const abilities = [
    ability("a1", "Second Wind", UsageType.BonusAction),
    ability("a2", "Action Surge", UsageType.FreeAction),
    ability("a3", "Fighting Style", UsageType.Passive),
];

describe("sectionForUsage", () => {
    it("maps every usage type", () => {
        expect(sectionForUsage(UsageType.Action)).toBe("action");
        expect(sectionForUsage(UsageType.BonusAction)).toBe("bonus");
        expect(sectionForUsage(UsageType.Reaction)).toBe("reaction");
        expect(sectionForUsage(UsageType.FreeAction)).toBe("passive");
        expect(sectionForUsage(UsageType.Passive)).toBe("passive");
        expect(sectionForUsage("SOMETHING")).toBe("action");
    });
});

describe("sectionForCastingTime", () => {
    it("sorts spells by casting time", () => {
        expect(sectionForCastingTime("1 action")).toBe("action");
        expect(sectionForCastingTime("1 bonus action")).toBe("bonus");
        expect(sectionForCastingTime("1 reaction, which you take when you see a creature casting")).toBe("reaction");
        expect(sectionForCastingTime("1 minute")).toBe("action");
        expect(sectionForCastingTime(undefined)).toBe("action");
    });
});

describe("groupActions", () => {
    const grouped = groupActions({ weapons: [longsword, longbow], knownSpells, spellDetails, abilities });

    it("puts weapons in Action and an opportunity attack for the melee weapon under Reaction", () => {
        expect(grouped.action.weapons.map(r => r.id)).toEqual(["weapon-w1", "weapon-w2"]);
        expect(grouped.reaction.weapons).toHaveLength(1);
        expect(grouped.reaction.weapons[0]).toMatchObject({ kind: "opportunity", weapon: longsword });
    });

    it("sorts spells into sections by casting time, by level then name", () => {
        expect(grouped.action.spells.map(r => r.id)).toEqual(["spell-fire-bolt", "spell-cure-wounds"]);
        expect(grouped.bonus.spells.map(r => r.id)).toEqual(["spell-healing-word"]);
        expect(grouped.reaction.spells.map(r => r.id)).toEqual(["spell-shield"]);
    });

    it("sorts abilities by usage", () => {
        expect(grouped.bonus.abilities.map(r => r.id)).toEqual(["ability-a1"]);
        expect(grouped.passive.abilities.map(r => r.id)).toEqual(["ability-a2", "ability-a3"]);
        expect(grouped.action.abilities).toHaveLength(0);
        expect(grouped.passive.weapons).toHaveLength(0);
        expect(grouped.passive.spells).toHaveLength(0);
    });

    it("has no opportunity attack with only ranged weapons", () => {
        const ranged = groupActions({ weapons: [longbow] });
        expect(ranged.reaction.weapons).toHaveLength(0);
    });

    it("puts spells without details in Action", () => {
        const g = groupActions({ knownSpells: [spell("shield", "Shield", 1)] });
        expect(g.action.spells).toHaveLength(1);
    });

    it("counts rows per section", () => {
        expect(sectionCounts(grouped)).toEqual({ action: 4, bonus: 2, reaction: 2, passive: 2, all: 10 });
    });
});

describe("attacksPerAction", () => {
    const lvl = (level: number, fields: Partial<LevelInfo> = {}): LevelInfo =>
        ({ level, features: [], class: { index: "x", name: "X", url: "" }, ...fields });

    it("uses the fighter's extra_attacks", () => {
        expect(attacksPerAction([lvl(5, { class_specific: { extra_attacks: 1 } })], 5)).toBe(2);
    });
    it("counts an extra-attack feature at or below the level", () => {
        const infos = [lvl(5, { features: [{ index: "extra-attack-1", name: "Extra Attack", url: "" }] }), lvl(6)];
        expect(attacksPerAction(infos, 6)).toBe(2);
        expect(attacksPerAction(infos, 4)).toBe(1);
    });
    it("counts an Extra Attack ability", () => {
        expect(attacksPerAction(undefined, 5, [ability("x", "Extra Attack", UsageType.Passive)])).toBe(2);
    });
    it("is 1 otherwise", () => {
        expect(attacksPerAction(undefined, 3)).toBe(1);
    });
});

describe("sectionHint", () => {
    it("only shows the Action hint with Extra Attack", () => {
        expect(sectionHint("action", 1)).toBeUndefined();
        expect(sectionHint("action", 2)).toMatch(/Extra Attack/);
        expect(sectionHint("bonus", 1)).toBe("One per turn");
        expect(sectionHint("reaction", 1)).toBe("One per round");
    });
});

describe("ability helpers", () => {
    it("detects slot-using abilities", () => {
        expect(abilityUsesSlot(ability("s", "Divine Smite", UsageType.FreeAction, { recovery: "Expends a spell slot" }))).toBe(true);
        expect(abilityUsesSlot(ability("s", "Smite", UsageType.FreeAction, { description: "Spend one slot to deal 2d8" }))).toBe(true);
        expect(abilityUsesSlot(ability("s", "Second Wind", UsageType.BonusAction, { recovery: "Short rest" }))).toBe(false);
    });
    it("picks a recovery tag", () => {
        expect(abilityRecoveryTag(ability("r", "Second Wind", UsageType.BonusAction, { recovery: " Short rest " }))).toBe("Short rest");
        expect(abilityRecoveryTag(ability("r", "Fighting Style", UsageType.Passive))).toBe("Passive");
        expect(abilityRecoveryTag(ability("r", "Dash", UsageType.Action))).toBe("At will");
    });
});
