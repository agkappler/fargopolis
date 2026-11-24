import Quest from "@/models/Quest";

/** New array sorted by ascending pointValue; ties by name, then questId. Never mutates the input. */
export function sortQuestsByPointValue(quests: readonly Quest[]): Quest[] {
    return [...quests].sort(
        (a, b) =>
            (a.pointValue ?? 0) - (b.pointValue ?? 0) ||
            (a.name ?? "").localeCompare(b.name ?? "") ||
            (a.questId ?? "").localeCompare(b.questId ?? ""),
    );
}
