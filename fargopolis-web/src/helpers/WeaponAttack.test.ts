import { testCharacter } from "@/components/dnd/testCharacter";
import Weapon from "@/models/Weapon";
import { describe, expect, it } from "vitest";
import { weaponAttack } from "./WeaponAttack";

const weapon = (fields: Partial<Weapon>): Weapon => ({
    weaponId: "w1",
    characterId: "char-1",
    name: "Weapon",
    damage: "1d6",
    range: "5 ft",
    damageType: "slashing",
    description: "",
    ...fields,
});

const scores = (str: number, dex: number) => ({ str, dex, con: 10, int: 10, wis: 10, cha: 10 });

describe("weaponAttack", () => {
    it("uses STR for a plain melee weapon", () => {
        const a = weaponAttack(weapon({ name: "Longsword", damage: "1d8" }), testCharacter({ level: 1, abilityScores: scores(16, 10) }));
        expect(a.ability).toBe("str");
        expect(a.toHit).toBe(5);
        expect(a.damageLabel).toBe("1d8+3");
        expect(a.isMelee).toBe(true);
    });

    it("picks the better of STR/DEX for finesse", () => {
        const a = weaponAttack(
            weapon({ name: "Rapier", damage: "1d8", description: "Finesse" }),
            testCharacter({ abilityScores: scores(10, 16) }),
        );
        expect(a.isFinesse).toBe(true);
        expect(a.ability).toBe("dex");
        expect(a.toHit).toBe(5);
    });

    it("uses DEX for ranged weapons", () => {
        const a = weaponAttack(
            weapon({ name: "Longbow", damage: "1d8", range: "150/600" }),
            testCharacter({ abilityScores: scores(16, 14) }),
        );
        expect(a.isRanged).toBe(true);
        expect(a.isMelee).toBe(false);
        expect(a.ability).toBe("dex");
        expect(a.toHit).toBe(4);
        expect(a.damageLabel).toBe("1d8+2");
    });

    it("keeps thrown weapons on STR and melee even with a range", () => {
        const a = weaponAttack(
            weapon({ name: "Handaxe", range: "20/60", description: "Light, thrown" }),
            testCharacter({ abilityScores: scores(14, 16) }),
        );
        expect(a.isRanged).toBe(false);
        expect(a.isMelee).toBe(true);
        expect(a.ability).toBe("str");
    });

    it("keeps a damage string with its own modifier as written", () => {
        const a = weaponAttack(weapon({ damage: "1d8+1" }), testCharacter({ abilityScores: scores(18, 10) }));
        expect(a.damageLabel).toBe("1d8+1");
        expect(a.damage).toEqual({ count: 1, sides: 8, bonus: 1 });
    });

    it("has no damage dice for free-text damage", () => {
        const a = weaponAttack(weapon({ damage: "see description" }), testCharacter());
        expect(a.damage).toBeUndefined();
        expect(a.damageLabel).toBe("see description");
    });
});
