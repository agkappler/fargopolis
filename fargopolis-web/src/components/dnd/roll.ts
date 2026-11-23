import { rollD20, rollMessage } from "@/helpers/Dice";
import { rollToast } from "@/helpers/Toasts";

/**
 * Roll 1d20 + modifier and toast the result. Roll buttons call `useRoller().rollD20` (rolls/rollContext),
 * which falls back to this toast text when no RollLogProvider is mounted (e.g. the Detail page).
 */
export function rollAndToast(label: string, modifier: number): void {
    const { roll, total } = rollD20(modifier);
    rollToast(rollMessage(label, modifier, roll, total));
}
