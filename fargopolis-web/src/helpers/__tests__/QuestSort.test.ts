import Quest from "@/models/Quest";
import { describe, expect, it } from "vitest";
import { sortQuestsByPointValue } from "../QuestSort";

const q = (questId: string, name: string, pointValue: number): Quest => ({
    questId,
    name,
    description: "",
    pointValue,
    active: true,
});

describe("sortQuestsByPointValue", () => {
    it("sorts by ascending point value", () => {
        const result = sortQuestsByPointValue([q("a", "A", 10), q("b", "B", 1), q("c", "C", 5)]);
        expect(result.map((x) => x.pointValue)).toEqual([1, 5, 10]);
    });

    it("breaks point ties by name", () => {
        const result = sortQuestsByPointValue([q("1", "Bravo", 3), q("2", "Alpha", 3)]);
        expect(result.map((x) => x.name)).toEqual(["Alpha", "Bravo"]);
    });

    it("breaks point and name ties by questId", () => {
        const result = sortQuestsByPointValue([q("z", "Same", 3), q("a", "Same", 3)]);
        expect(result.map((x) => x.questId)).toEqual(["a", "z"]);
    });

    it("does not mutate the input and returns a new array", () => {
        const input = [q("a", "A", 10), q("b", "B", 1)];
        const snapshot = [...input];
        const result = sortQuestsByPointValue(input);
        expect(input).toEqual(snapshot);
        expect(input[0].questId).toBe("a");
        expect(result).not.toBe(input);
    });

    it("returns an empty array for empty input", () => {
        expect(sortQuestsByPointValue([])).toEqual([]);
    });
});
