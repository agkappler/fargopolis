import { describe, expect, it } from "vitest";
import { applyDamage, applyHeal, hpBarColor, hpBarSegments, keypadInput, longRest, setTempHp } from "../HitPoints";

const hp = (current: number, max: number, temp = 0) => ({ current, max, temp });

describe("applyDamage", () => {
    it("takes damage from temp HP first", () => {
        expect(applyDamage(hp(10, 20, 5), 3)).toEqual(hp(10, 20, 2));
    });
    it("carries damage past temp into current HP", () => {
        expect(applyDamage(hp(10, 20, 5), 8)).toEqual(hp(7, 20, 0));
    });
    it("never drops current below 0", () => {
        expect(applyDamage(hp(10, 20, 5), 100)).toEqual(hp(0, 20, 0));
    });
    it("ignores 0 and negative amounts", () => {
        const start = hp(10, 20, 5);
        expect(applyDamage(start, 0)).toEqual(start);
        expect(applyDamage(start, -4)).toEqual(start);
    });
});

describe("applyHeal", () => {
    it("caps at max", () => {
        expect(applyHeal(hp(18, 20), 5)).toEqual(hp(20, 20));
    });
    it("leaves temp HP alone", () => {
        expect(applyHeal(hp(5, 20, 3), 4)).toEqual(hp(9, 20, 3));
    });
    it("doesn't lower a current already above max", () => {
        expect(applyHeal(hp(25, 20), 5)).toEqual(hp(25, 20));
    });
});

describe("setTempHp / longRest", () => {
    it("sets temp HP rather than adding to it", () => {
        expect(setTempHp(hp(10, 20, 5), 3)).toEqual(hp(10, 20, 3));
    });
    it("treats a negative temp amount as 0", () => {
        expect(setTempHp(hp(10, 20, 5), -2)).toEqual(hp(10, 20, 0));
    });
    it("long rest restores max and clears temp", () => {
        expect(longRest(hp(3, 20, 4))).toEqual(hp(20, 20, 0));
    });
});

describe("hpBarColor", () => {
    it("is pine above 50%, amber above 25%, garnet otherwise", () => {
        expect(hpBarColor(11, 20)).toBe("pine.500");
        expect(hpBarColor(10, 20)).toBe("amber.500");
        expect(hpBarColor(6, 20)).toBe("amber.500");
        expect(hpBarColor(5, 20)).toBe("garnet.500");
        expect(hpBarColor(0, 0)).toBe("garnet.500");
    });
});

describe("hpBarSegments", () => {
    it("uses max + temp as the denominator when there is temp HP", () => {
        expect(hpBarSegments(hp(10, 20, 5))).toEqual({ currentPct: 40, tempPct: 20 });
    });
    it("is all zero when max is 0", () => {
        expect(hpBarSegments(hp(0, 0))).toEqual({ currentPct: 0, tempPct: 0 });
    });
    it("fills the bar at full HP with no temp", () => {
        expect(hpBarSegments(hp(20, 20))).toEqual({ currentPct: 100, tempPct: 0 });
    });
});

describe("keypadInput", () => {
    it("appends digits up to 3", () => {
        const typed = ["1", "2", "3", "4"].reduce(keypadInput, "");
        expect(typed).toBe("123");
    });
    it("strips leading zeros", () => {
        expect(keypadInput("", "0")).toBe("");
        expect(keypadInput("0", "5")).toBe("5");
    });
    it("C clears and ⌫ deletes one", () => {
        expect(keypadInput("12", "C")).toBe("");
        expect(keypadInput("12", "⌫")).toBe("1");
        expect(keypadInput("", "⌫")).toBe("");
    });
});
