import { rollD20, rollMessage } from "@/helpers/Dice";
import { rollToast } from "@/helpers/Toasts";

/** Roll 1d20 + modifier and toast the result — the one roll behaviour every roll button shares. */
export function rollAndToast(label: string, modifier: number): void {
    const { roll, total } = rollD20(modifier);
    rollToast(rollMessage(label, modifier, roll, total));
}
