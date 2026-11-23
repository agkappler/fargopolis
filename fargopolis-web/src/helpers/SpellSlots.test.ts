import { describe, expect, it } from "vitest";
import type { Spellcasting } from "@/api/dnd5eapi";
import {
    clampUsed,
    hasAnySlots,
    lowestAvailableSlotLevel,
    ordinal,
    remaining,
    restoreAll,
    restoreSlot,
    slotMaxFromSpellcasting,
    spendSlot,
    togglePip,
} from "./SpellSlots";

const fullCaster20: Spellcasting = {
    cantrips_known: 5,
    spells_known: 0,
    spell_slots_level_1: 4,
    spell_slots_level_2: 3,
    spell_slots_level_3: 3,
    spell_slots_level_4: 3,
    spell_slots_level_5: 3,
    spell_slots_level_6: 2,
    spell_slots_level_7: 2,
    spell_slots_level_8: 1,
    spell_slots_level_9: 1,
};

const Z = [0, 0, 0, 0, 0, 0, 0, 0, 0];

describe("slotMaxFromSpellcasting", () => {
    it("maps a level-20 full caster", () => {
        expect(slotMaxFromSpellcasting(fullCaster20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
    });
    it("is 9 zeros without spellcasting", () => {
        expect(slotMaxFromSpellcasting(undefined)).toEqual(Z);
        expect(hasAnySlots(Z)).toBe(false);
        expect(hasAnySlots([2, ...Z.slice(1)])).toBe(true);
    });
});

describe("lowestAvailableSlotLevel", () => {
    const max = [4, 3, 2, 0, 0, 0, 0, 0, 0];
    it("uses the spell's own level when a slot is left", () => {
        expect(lowestAvailableSlotLevel(max, Z, 1)).toBe(1);
        expect(lowestAvailableSlotLevel(max, Z, 2)).toBe(2);
    });
    it("upcasts past exhausted levels", () => {
        expect(lowestAvailableSlotLevel(max, [4, 3, 0, 0, 0, 0, 0, 0, 0], 1)).toBe(3);
    });
    it("is undefined when nothing at or above the level is left", () => {
        expect(lowestAvailableSlotLevel(max, [0, 0, 2, 0, 0, 0, 0, 0, 0], 3)).toBeUndefined();
        expect(lowestAvailableSlotLevel(max, Z, 4)).toBeUndefined();
    });
    it("treats minLevel 0 as 1", () => {
        expect(lowestAvailableSlotLevel(max, Z, 0)).toBe(1);
    });
    it("skips levels whose max is 0 (warlock-style)", () => {
        expect(lowestAvailableSlotLevel([0, 0, 2, 0, 0, 0, 0, 0, 0], Z, 1)).toBe(3);
    });
});

describe("spend / restore / toggle", () => {
    const max = [2, 1, 0, 0, 0, 0, 0, 0, 0];
    it("spendSlot adds one and is a no-op when none remain", () => {
        const once = spendSlot(Z, max, 1);
        expect(once[0]).toBe(1);
        expect(Z[0]).toBe(0);
        const twice = spendSlot(once, max, 1);
        expect(spendSlot(twice, max, 1)).toBe(twice);
        expect(spendSlot(Z, max, 3)).toBe(Z);
        expect(remaining(max, twice, 1)).toBe(0);
    });
    it("restoreSlot floors at 0", () => {
        expect(restoreSlot([1, ...Z.slice(1)], 1)[0]).toBe(0);
        expect(restoreSlot(Z, 1)).toBe(Z);
    });
    it("togglePip restores a spent pip and spends an available one", () => {
        const used = [1, ...Z.slice(1)];
        expect(togglePip(used, max, 1, 0)[0]).toBe(0);
        expect(togglePip(used, max, 1, 1)[0]).toBe(2);
    });
    it("clampUsed trims to a smaller max and pads to 9", () => {
        expect(clampUsed([3, 2, 5], max)).toEqual([2, 1, 0, 0, 0, 0, 0, 0, 0]);
        expect(clampUsed([-1], max)).toEqual(Z);
    });
    it("restoreAll is 9 zeros", () => {
        expect(restoreAll()).toEqual(Z);
    });
});

describe("ordinal", () => {
    it("formats 1st..9th", () => {
        expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"]);
        expect(ordinal(11)).toBe("11th");
        expect(ordinal(21)).toBe("21st");
    });
});
