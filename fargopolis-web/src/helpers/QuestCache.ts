import Quest from "@/models/Quest";

// Persisted copy of the last successful quests response, so a cold PWA open can render the
// last-known list immediately. Namespaced by Clerk user id and request URL; this module is the
// only place that touches localStorage, and every access is guarded (storage may be unavailable).
const PREFIX = "fargopolis:quests:v1";

export function questCacheKey(userId: string, url: string): string {
    return `${PREFIX}:${userId}:${url}`;
}

export function readCachedQuests(userId: string, url: string): Quest[] | undefined {
    try {
        const raw = globalThis.localStorage?.getItem(questCacheKey(userId, url));
        if (!raw) return undefined;
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as Quest[]) : undefined;
    } catch {
        return undefined;
    }
}

export function writeCachedQuests(userId: string, url: string, quests: Quest[]): void {
    try {
        globalThis.localStorage?.setItem(questCacheKey(userId, url), JSON.stringify(quests));
    } catch {
        // storage unavailable or full: ignore
    }
}
