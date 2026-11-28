import type { Spellcasting } from "@/api/dnd5eapi";

/** Slots per spell level; index 0 is 1st level. Always 9 entries. */
export type SlotLevels = number[];

export const SLOT_LEVELS = 9;

const zeros = (): SlotLevels => Array.from({ length: SLOT_LEVELS }, () => 0);

export function slotMaxFromSpellcasting(sc?: Spellcasting | null): SlotLevels {
    if (!sc) return zeros();
    const record = sc as unknown as Record<string, unknown>;
    return zeros().map((_, i) => {
        const v = record[`spell_slots_level_${i + 1}`];
        return typeof v === "number" && v > 0 ? Math.floor(v) : 0;
    });
}

export function hasAnySlots(max: SlotLevels): boolean {
    return max.some(n => n > 0);
}

/** Pad/trim to 9 and keep each used count within 0..max. */
export function clampUsed(used: readonly number[], max: SlotLevels): SlotLevels {
    return zeros().map((_, i) => {
        const u = Number.isFinite(used[i]) ? Math.floor(used[i]) : 0;
        return Math.min(Math.max(0, u), max[i] ?? 0);
    });
}

/** Remaining slots at a 1-based level. */
export function remaining(max: SlotLevels, used: SlotLevels, level: number): number {
    const i = level - 1;
    if (i < 0 || i >= SLOT_LEVELS) return 0;
    return Math.max(0, (max[i] ?? 0) - (used[i] ?? 0));
}

/** Lowest 1-based level ≥ max(1, minLevel) with a slot left, or undefined. */
export function lowestAvailableSlotLevel(max: SlotLevels, used: SlotLevels, minLevel: number): number | undefined {
    for (let level = Math.max(1, Math.floor(minLevel)); level <= SLOT_LEVELS; level++) {
        if (remaining(max, used, level) > 0) return level;
    }
    return undefined;
}

export function spendSlot(used: SlotLevels, max: SlotLevels, level: number): SlotLevels {
    if (remaining(max, used, level) <= 0) return used;
    const next = [...used];
    next[level - 1] = (next[level - 1] ?? 0) + 1;
    return next;
}

export function restoreSlot(used: SlotLevels, level: number): SlotLevels {
    const i = level - 1;
    if (i < 0 || i >= SLOT_LEVELS || (used[i] ?? 0) <= 0) return used;
    const next = [...used];
    next[i] = next[i] - 1;
    return next;
}

/** Pips 0..used-1 are spent: tapping a spent pip restores one, tapping an available pip spends one. */
export function togglePip(used: SlotLevels, max: SlotLevels, level: number, pipIndex: number): SlotLevels {
    const spent = used[level - 1] ?? 0;
    return pipIndex < spent ? restoreSlot(used, level) : spendSlot(used, max, level);
}

export function restoreAll(): SlotLevels {
    return zeros();
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th", 11 → "11th", 21 → "21st". */
export function ordinal(n: number): string {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    switch (n % 10) {
        case 1: return `${n}st`;
        case 2: return `${n}nd`;
        case 3: return `${n}rd`;
        default: return `${n}th`;
    }
}
