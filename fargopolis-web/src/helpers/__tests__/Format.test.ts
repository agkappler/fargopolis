import { describe, expect, it } from "vitest";
import { formatIndexName, formatRaceLabel } from "../Format";

describe("formatIndexName", () => {
    it.each([
        ["wood-elf", "Wood Elf"],
        ["hunter", "Hunter"],
        ["school_of_evocation", "School Of Evocation"],
        ["", ""],
        [undefined, ""],
    ])("%s → %s", (value: string | undefined, expected: string) => {
        expect(formatIndexName(value)).toBe(expected);
    });
});

describe("formatRaceLabel", () => {
    it("shows the subrace alone when it already names the race", () => {
        expect(formatRaceLabel("elf", "wood-elf")).toBe("Wood Elf");
    });

    it("shows Race (Subrace) otherwise", () => {
        expect(formatRaceLabel("halfling", "stout")).toBe("Halfling (Stout)");
    });

    it("shows just the race when there is no subrace", () => {
        expect(formatRaceLabel("human", "")).toBe("Human");
        expect(formatRaceLabel("human")).toBe("Human");
    });
});
