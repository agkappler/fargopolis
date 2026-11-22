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
