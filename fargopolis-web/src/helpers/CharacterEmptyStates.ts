import { ABILITY_KEYS } from "@/constants/Skills";
import Character from "@/models/Character";
import { withStatDefaults } from "./CharacterStats";

/**
 * Empty-state checks for the Character Detail stat cards. They read the raw character
 * (not `withStatDefaults`, which would hide a missing AC behind 10): the API returns 0 for
 * unset AC/speed/max HP on a new character, and older items may omit the keys entirely, so
 * missing, null and 0 all count as "not set".
 */
const isSet = (n: unknown): boolean => typeof n === "number" && Number.isFinite(n) && n > 0;

/** True when neither AC nor speed has been set. Initiative 0 is a legitimate value, so it's ignored. */
export function vitalsAreUnset(c: Character): boolean {
    const raw = c as Partial<Pick<Character, "armorClass" | "speed">>;
    return !isSet(raw.armorClass) && !isSet(raw.speed);
}

/** True when max HP hasn't been set. */
export function maxHpIsUnset(c: Character): boolean {
    const hp = c.hitPoints as Partial<Character["hitPoints"]> | null | undefined;
    return !isSet(hp?.max);
}

/** True when every ability score is still the default 10 (missing scores default to 10). */
export function abilityScoresAreDefault(c: Character): boolean {
    const scores = withStatDefaults(c).abilityScores;
    return ABILITY_KEYS.every(key => scores[key] === 10);
}
