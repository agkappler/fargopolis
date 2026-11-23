import { afterEach, describe, expect, it, vi } from "vitest";
import { findDiceInText, formatDiceExpression, parseDiceExpression, rollDiceExpression } from "./Dice";

afterEach(() => vi.restoreAllMocks());

describe("parseDiceExpression", () => {
    it("parses XdY, XdY+Z, spaced and negative bonuses, and dY", () => {
        expect(parseDiceExpression("2d6")).toEqual({ count: 2, sides: 6, bonus: 0 });
        expect(parseDiceExpression("1d8+3")).toEqual({ count: 1, sides: 8, bonus: 3 });
        expect(parseDiceExpression(" 1d4 - 1 ")).toEqual({ count: 1, sides: 4, bonus: -1 });
        expect(parseDiceExpression("d6")).toEqual({ count: 1, sides: 6, bonus: 0 });
        expect(parseDiceExpression("1D10")).toEqual({ count: 1, sides: 10, bonus: 0 });
    });
    it("rejects anything else", () => {
        expect(parseDiceExpression("")).toBeUndefined();
        expect(parseDiceExpression("slashing")).toBeUndefined();
        expect(parseDiceExpression("1d8 slashing")).toBeUndefined();
        expect(parseDiceExpression("1d1")).toBeUndefined();
        expect(parseDiceExpression("101d6")).toBeUndefined();
        expect(parseDiceExpression("0d6")).toBeUndefined();
    });
});

describe("formatDiceExpression", () => {
    it("formats positive, zero and negative bonuses", () => {
        expect(formatDiceExpression({ count: 2, sides: 6, bonus: 3 })).toBe("2d6+3");
        expect(formatDiceExpression({ count: 1, sides: 8, bonus: 0 })).toBe("1d8");
        expect(formatDiceExpression({ count: 1, sides: 4, bonus: -1 })).toBe("1d4-1");
    });
});

describe("rollDiceExpression", () => {
    it("rolls each die and adds the bonus", () => {
        vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.99);
        expect(rollDiceExpression({ count: 2, sides: 6, bonus: 2 })).toEqual({ rolls: [1, 6], total: 9 });
    });
});

describe("findDiceInText", () => {
    it("finds the first dice expression", () => {
        expect(findDiceInText("You regain 1d10 + 5 hit points.")).toBe("1d10 + 5");
        expect(findDiceInText("Deal an extra 2d8 radiant damage")).toBe("2d8");
    });
    it("returns undefined when there are no dice", () => {
        expect(findDiceInText("Advantage on saves")).toBeUndefined();
        expect(findDiceInText(undefined)).toBeUndefined();
        expect(findDiceInText("Bend10 bars")).toBeUndefined();
    });
});
