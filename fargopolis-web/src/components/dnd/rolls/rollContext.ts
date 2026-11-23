/**
 * Session roll log for the Play page. Entries live in memory only and are lost on reload —
 * persisting roll history is follow-up issue #44.
 */
import { DiceExpression, formatDiceExpression, rollD20 as rollD20Dice, rollDiceExpression, rollMessage } from "@/helpers/Dice";
import { rollToast } from "@/helpers/Toasts";
import { createContext, useContext } from "react";

export interface RollEntry {
    id: string;
    label: string;
    kind: "d20" | "dice" | "event";
    total?: number;
    math?: string;
    natural?: 20 | 1;
    note?: string;
    at: number;
}

export type NewRollEntry = Omit<RollEntry, "id" | "at">;

export const RollContext = createContext<{ record(entry: NewRollEntry): void } | null>(null);

export interface RollLogState {
    entries: RollEntry[];
    latest?: RollEntry;
    isLogOpen: boolean;
    openLog(): void;
    closeLog(): void;
    clear(): void;
}

export const RollLogContext = createContext<RollLogState | null>(null);

/** Roll log state (entries, open/close) — only inside a RollLogProvider. */
export function useRollLog(): RollLogState {
    const ctx = useContext(RollLogContext);
    if (!ctx) throw new Error("useRollLog must be used inside a RollLogProvider");
    return ctx;
}

/** " + 4", " − 1" or "" for 0 — the modifier as it reads in the roll math. */
const signed = (n: number) => (n > 0 ? ` + ${n}` : n < 0 ? ` − ${Math.abs(n)}` : "");

export function d20Math(roll: number, modifier: number): string {
    return `d20 ${roll}${signed(modifier)}`;
}

export function diceMath(parsed: DiceExpression, rolls: number[]): string {
    return `${parsed.count}d${parsed.sides} [${rolls.join(", ")}]${signed(parsed.bonus)}`;
}

/**
 * Every roll button goes through this. Inside a RollLogProvider (the Play page) rolls are
 * logged and shown in the bottom-left toast; without one (the Detail page) they fall back to the
 * plain react-toastify roll toast, exactly like `rollAndToast`.
 */
export function useRoller() {
    const ctx = useContext(RollContext);

    const rollD20 = (label: string, modifier: number) => {
        const { roll, total } = rollD20Dice(modifier);
        if (!ctx) {
            rollToast(rollMessage(label, modifier, roll, total));
            return;
        }
        ctx.record({
            label,
            kind: "d20",
            total,
            math: d20Math(roll, modifier),
            natural: roll === 20 ? 20 : roll === 1 ? 1 : undefined,
        });
    };

    const rollDice = (label: string, parsed: DiceExpression) => {
        const { rolls, total } = rollDiceExpression(parsed);
        if (!ctx) {
            rollToast(`${label}: ${formatDiceExpression(parsed)} → ${total} (rolled ${rolls.join(", ")})`);
            return;
        }
        ctx.record({ label, kind: "dice", total, math: diceMath(parsed, rolls) });
    };

    const logEvent = (label: string, note: string) => {
        if (!ctx) {
            rollToast(`${label} — ${note}`);
            return;
        }
        ctx.record({ label, kind: "event", note });
    };

    return { rollD20, rollDice, logEvent };
}
