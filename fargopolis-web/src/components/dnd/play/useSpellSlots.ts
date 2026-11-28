import {
    clampUsed,
    lowestAvailableSlotLevel,
    restoreAll as noneUsed,
    SlotLevels,
    spendSlot,
    togglePip as togglePipLevels,
} from "@/helpers/SpellSlots";
import { useEffect, useRef, useState } from "react";

export const FLASH_MS = 900;

const storageKey = (characterId: string) => `fargopolis.spellSlotsUsed.${characterId}`;

/**
 * Spent spell slots are client-side only: kept in localStorage per character so a reload mid-session
 * keeps them, but they don't sync across devices. `/updateCharacter` has no spell-slot field, so
 * server persistence needs a backend change (follow-up with #43/#44).
 */
function readUsed(characterId: string): number[] {
    try {
        const raw = window.localStorage.getItem(storageKey(characterId));
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
        return [];
    }
}

function writeUsed(characterId: string, used: SlotLevels) {
    try {
        window.localStorage.setItem(storageKey(characterId), JSON.stringify(used));
    } catch {
        // Private mode / storage full: keep the in-memory state only.
    }
}

export function useSpellSlots(characterId: string, max: SlotLevels) {
    const maxKey = max.join(",");
    const [used, setUsed] = useState<SlotLevels>(() => clampUsed(readUsed(characterId), max));
    const usedRef = useRef(used);
    usedRef.current = used;
    const [flashLevel, setFlashLevel] = useState<number>();
    const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Reload on a character switch; clamp when the max changes (level-up / level info arriving).
    useEffect(() => {
        setUsed(clampUsed(readUsed(characterId), max));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characterId, maxKey]);

    useEffect(() => () => clearTimeout(flashTimer.current), []);

    const commit = (next: SlotLevels) => {
        usedRef.current = next;
        setUsed(next);
        writeUsed(characterId, next);
    };

    /** Spend the lowest slot at or above `minLevel`; returns the 1-based level spent, or undefined. */
    const spend = (minLevel: number): number | undefined => {
        const level = lowestAvailableSlotLevel(max, usedRef.current, minLevel);
        if (level === undefined) return undefined;
        commit(spendSlot(usedRef.current, max, level));
        setFlashLevel(level);
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlashLevel(undefined), FLASH_MS);
        return level;
    };

    return {
        max,
        used,
        spend,
        togglePip: (level: number, pipIndex: number) => commit(togglePipLevels(usedRef.current, max, level, pipIndex)),
        restoreAll: () => commit(noneUsed()),
        flashLevel,
    };
}

export type SpellSlotsState = ReturnType<typeof useSpellSlots>;
