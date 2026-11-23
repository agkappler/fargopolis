import { formatModifier } from "./DndMath";

export function rollDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
}

export function rollD20(modifier: number): { roll: number; total: number } {
    const roll = rollDie(20);
    return { roll, total: roll + modifier };
}

export const rollMessage = (label: string, modifier: number, roll: number, total: number) =>
    `${label}: d20${formatModifier(modifier)} → ${total} (rolled ${roll})`;

export interface DiceExpression {
    count: number;
    sides: number;
    bonus: number;
}

const DICE_RE = /^(\d*)d(\d+)(?:([+-])(\d+))?$/i;

/** Parse "XdY", "XdY+Z", "XdY - Z" or "dY" (count 1). Whitespace is ignored. Undefined for anything else. */
export function parseDiceExpression(expr: string): DiceExpression | undefined {
    if (typeof expr !== "string") return undefined;
    const m = DICE_RE.exec(expr.replace(/\s+/g, ""));
    if (!m) return undefined;
    const count = m[1] === "" ? 1 : Number(m[1]);
    const sides = Number(m[2]);
    if (!Number.isFinite(count) || count < 1 || count > 100) return undefined;
    if (!Number.isFinite(sides) || sides < 2) return undefined;
    const bonus = m[3] ? (m[3] === "-" ? -1 : 1) * Number(m[4]) : 0;
    return { count, sides, bonus };
}

/** "2d6+3", "1d8" or "1d4-1". */
export function formatDiceExpression({ count, sides, bonus }: DiceExpression): string {
    const tail = bonus > 0 ? `+${bonus}` : bonus < 0 ? `${bonus}` : "";
    return `${count}d${sides}${tail}`;
}

export function rollDiceExpression(parsed: DiceExpression): { rolls: number[]; total: number } {
    const rolls = Array.from({ length: parsed.count }, () => rollDie(parsed.sides));
    const total = rolls.reduce((sum, r) => sum + r, 0) + parsed.bonus;
    return { rolls, total };
}

/** The first dice expression in free text ("deal 1d8 + 2 fire damage" → "1d8 + 2"), or undefined. */
export function findDiceInText(text?: string | null): string | undefined {
    if (!text) return undefined;
    // The lookbehind stops a word ending in "d" ("Bend10") from reading as dice.
    const re = /(?<![a-z\d])\d*d\d+(?:\s*[+-]\s*\d+)?/gi;
    for (const m of text.matchAll(re)) {
        if (parseDiceExpression(m[0])) return m[0];
    }
    return undefined;
}
