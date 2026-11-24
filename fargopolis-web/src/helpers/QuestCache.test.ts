// @vitest-environment jsdom
import "@/test/setup";
import Quest from "@/models/Quest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { questCacheKey, readCachedQuests, writeCachedQuests } from "./QuestCache";

const quests: Quest[] = [{ questId: "q1", name: "Wash dishes", description: "", pointValue: 5, active: true }];

describe("QuestCache", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("round-trips a write then read", () => {
        writeCachedQuests("user_a", "/quests", quests);
        expect(readCachedQuests("user_a", "/quests")).toEqual(quests);
    });

    it("isolates by user id and by URL", () => {
        writeCachedQuests("user_a", "/quests", quests);
        expect(readCachedQuests("user_b", "/quests")).toBeUndefined();
        expect(readCachedQuests("user_a", "/quests?includeInactive=true")).toBeUndefined();

        const archived: Quest[] = [{ questId: "q2", name: "Old", description: "", pointValue: 1, active: false }];
        writeCachedQuests("user_a", "/quests?includeInactive=true", archived);
        expect(readCachedQuests("user_a", "/quests")).toEqual(quests);
        expect(readCachedQuests("user_a", "/quests?includeInactive=true")).toEqual(archived);
    });

    it("returns undefined for invalid or non-array JSON", () => {
        localStorage.setItem(questCacheKey("user_a", "/quests"), "{not json");
        expect(readCachedQuests("user_a", "/quests")).toBeUndefined();
        localStorage.setItem(questCacheKey("user_a", "/quests"), JSON.stringify({ questId: "q1" }));
        expect(readCachedQuests("user_a", "/quests")).toBeUndefined();
    });

    it("returns undefined when reading from storage throws", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("unavailable");
        });
        expect(() => readCachedQuests("user_a", "/quests")).not.toThrow();
        expect(readCachedQuests("user_a", "/quests")).toBeUndefined();
    });

    it("does not throw when writing to storage throws", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("quota");
        });
        expect(() => writeCachedQuests("user_a", "/quests", quests)).not.toThrow();
    });
});
