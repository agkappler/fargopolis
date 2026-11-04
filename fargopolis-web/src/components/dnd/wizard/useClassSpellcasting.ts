import { getLevelInfoForClass, LevelInfo } from "@/api/dnd5eapi";
import useSWR from "swr";
import { castableSpellLevels } from "./wizardConfig";

/**
 * Spellcasting info for a class at a level. `isCaster` is undefined while unknown
 * (no class yet, or still loading), so the Spells step stays in the list until we know.
 */
export function useClassSpellcasting(className?: string, level?: number | string) {
    const { data, error, isLoading } = useSWR<LevelInfo[]>(
        // Same key as CharacterInfo.tsx, so the cache is shared.
        className ? `/class/${className}/levels` : null,
        () => (className ? getLevelInfoForClass(className) : Promise.resolve([])),
    );
    // getLevelInfoForClass doesn't reject on HTTP errors, so a 404/500 resolves to an
    // error object. Only treat an array as level data.
    const levels = Array.isArray(data) ? data : undefined;
    const spellcasting = levels?.find(l => l.level === Number(level))?.spellcasting;

    let isCaster: boolean | undefined;
    if (!className || isLoading) isCaster = undefined;
    else if (error || !levels) isCaster = false;
    else isCaster = castableSpellLevels(spellcasting).length > 0;

    return { spellcasting, isCaster };
}
