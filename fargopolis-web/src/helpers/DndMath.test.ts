import { describe, expect, it } from "vitest";
import { abilityModifier, checkModifier, formatModifier, proficiencyBonusForLevel } from "./DndMath";

describe("abilityModifier", () => {
    it.each([
        [10, 0],
        [11, 0],
        [8, -1],
        [1, -5],
        [20, 5],
    ])("score %i → %i", (score: number, expected: number) => {
        expect(abilityModifier(score)).toBe(expected);
    });
});

describe("proficiencyBonusForLevel", () => {
    it.each([
        [1, 2],
        [4, 2],
        [5, 3],
        [17, 6],
        [25, 6],
        [0, 2],
        [NaN, 2],
    ])("level %d → +%i", (level: number, expected: number) => {
        expect(proficiencyBonusForLevel(level)).toBe(expected);
    });
});

describe("formatModifier", () => {
    it("adds a plus sign to positives", () => {
        expect(formatModifier(3)).toBe("+3");
    });
    it("formats zero and negative zero as +0", () => {
        expect(formatModifier(0)).toBe("+0");
        expect(formatModifier(-0)).toBe("+0");
    });
    it("keeps the minus sign on negatives", () => {
        expect(formatModifier(-1)).toBe("-1");
    });
});

describe("checkModifier", () => {
    it("adds the proficiency bonus when proficient", () => {
        expect(checkModifier(14, 3, true)).toBe(5);
    });
    it("uses only the ability modifier when not proficient", () => {
        expect(checkModifier(14, 3, false)).toBe(2);
    });
});
