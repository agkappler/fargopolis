import Character from "@/models/Character";
import { describe, expect, it } from "vitest";
import { abilityScoresAreDefault, maxHpIsUnset, vitalsAreUnset } from "./CharacterEmptyStates";

/** Build a raw API-shaped character; tests pass partial/missing fields on purpose. */
const raw = (fields: Record<string, unknown>) => ({ characterId: "c1", name: "Test", level: 1, ...fields }) as unknown as Character;

describe("vitalsAreUnset", () => {
    it("is true for the API's new-character shape (AC 0, speed 0)", () => {
        expect(vitalsAreUnset(raw({ armorClass: 0, speed: 0, initiativeBonus: 0 }))).toBe(true);
    });

    it("is true when the fields are missing or null", () => {
        expect(vitalsAreUnset(raw({}))).toBe(true);
        expect(vitalsAreUnset(raw({ armorClass: null, speed: null }))).toBe(true);
    });

    it("ignores initiative (0 or otherwise)", () => {
        expect(vitalsAreUnset(raw({ armorClass: 0, speed: 0, initiativeBonus: 3 }))).toBe(true);
    });

    it("is false when AC is set", () => {
        expect(vitalsAreUnset(raw({ armorClass: 15, speed: 0 }))).toBe(false);
    });

    it("is false when only speed is set", () => {
        expect(vitalsAreUnset(raw({ armorClass: 0, speed: 30 }))).toBe(false);
    });
});

describe("maxHpIsUnset", () => {
    it("is true for max 0", () => {
        expect(maxHpIsUnset(raw({ hitPoints: { current: 0, max: 0, temp: 0 } }))).toBe(true);
    });

    it("is true when hitPoints is missing or empty", () => {
        expect(maxHpIsUnset(raw({}))).toBe(true);
        expect(maxHpIsUnset(raw({ hitPoints: {} }))).toBe(true);
        expect(maxHpIsUnset(raw({ hitPoints: null }))).toBe(true);
    });

    it("is false when max HP is set", () => {
        expect(maxHpIsUnset(raw({ hitPoints: { current: 5, max: 12, temp: 0 } }))).toBe(false);
    });
});

describe("abilityScoresAreDefault", () => {
    const tens = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

    it("is true when every score is 10", () => {
        expect(abilityScoresAreDefault(raw({ abilityScores: tens }))).toBe(true);
    });

    it("is true when abilityScores is missing", () => {
        expect(abilityScoresAreDefault(raw({}))).toBe(true);
    });

    it("is true for a partial map whose present keys are 10", () => {
        expect(abilityScoresAreDefault(raw({ abilityScores: { str: 10, wis: 10 } }))).toBe(true);
    });

    it("is false when any score differs", () => {
        expect(abilityScoresAreDefault(raw({ abilityScores: { ...tens, cha: 11 } }))).toBe(false);
    });
});
