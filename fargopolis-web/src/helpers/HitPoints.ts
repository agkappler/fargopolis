import type { HitPoints } from "@/models/Character";

const amount = (n: number): number => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

/** Damage comes off temp HP first, then current HP (never below 0). */
export function applyDamage(hp: HitPoints, n: number): HitPoints {
    const dmg = amount(n);
    if (dmg === 0) return hp;
    const absorbed = Math.min(hp.temp, dmg);
    return { ...hp, temp: hp.temp - absorbed, current: Math.max(0, hp.current - (dmg - absorbed)) };
}

/** Heal caps at max. Temp is untouched; a current already above max (legacy data) isn't lowered. */
export function applyHeal(hp: HitPoints, n: number): HitPoints {
    const heal = amount(n);
    if (heal === 0 || hp.current >= hp.max) return hp;
    return { ...hp, current: Math.min(hp.max, hp.current + heal) };
}

/** Temp HP is set to the amount (not added). */
export function setTempHp(hp: HitPoints, n: number): HitPoints {
    return { ...hp, temp: amount(n) };
}

export function longRest(hp: HitPoints): HitPoints {
    return { current: hp.max, max: hp.max, temp: 0 };
}

/** HP bar colour: >50% pine, >25% amber, else garnet. */
export function hpBarColor(current: number, max: number): string {
    const ratio = max > 0 ? current / max : 0;
    if (ratio > 0.5) return "pine.500";
    if (ratio > 0.25) return "amber.500";
    return "garnet.500";
}

const pct = (n: number) => Math.min(100, Math.max(0, n));

/** Bar widths; with temp HP the denominator is max + temp so the temp segment fits. */
export function hpBarSegments(hp: HitPoints): { currentPct: number; tempPct: number } {
    const temp = Math.max(0, hp.temp);
    const denom = hp.max + temp;
    if (denom <= 0) return { currentPct: 0, tempPct: 0 };
    const currentPct = pct((Math.min(hp.current, hp.max) / denom) * 100);
    const tempPct = Math.min(100 - currentPct, pct((temp / denom) * 100));
    return { currentPct, tempPct };
}

export const KEYPAD_MAX_DIGITS = 3;

/** Keypad display reducer: digits append (max 3, no leading zeros), "C" clears, "⌫" deletes one. */
export function keypadInput(display: string, key: string): string {
    if (key === "C") return "";
    if (key === "⌫") return display.slice(0, -1);
    if (!/^\d$/.test(key)) return display;
    const next = (display + key).replace(/^0+/, "");
    return next.length > KEYPAD_MAX_DIGITS ? display : next;
}
