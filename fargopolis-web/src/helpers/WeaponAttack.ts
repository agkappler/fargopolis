import Character from "@/models/Character";
import Weapon from "@/models/Weapon";
import { withStatDefaults } from "./CharacterStats";
import { DiceExpression, formatDiceExpression, parseDiceExpression } from "./Dice";
import { abilityModifier, proficiencyBonusForLevel } from "./DndMath";

export interface WeaponAttack {
    ability: "str" | "dex";
    toHit: number;
    /** Parsed damage dice with the ability modifier applied, or undefined when `weapon.damage` is free text. */
    damage?: DiceExpression;
    /** "1d8+3", or the raw damage text when it doesn't parse. */
    damageLabel: string;
    isMelee: boolean;
    isFinesse: boolean;
    isRanged: boolean;
}

const RANGED_WORDS = /ammunition|ranged|\bbow\b|longbow|shortbow|crossbow|sling|blowgun/;

/**
 * Attack math for a weapon row. `Weapon` has no attack bonus, so this is a heuristic:
 * finesse → the better of STR/DEX, ranged → DEX, otherwise STR; to-hit = ability mod +
 * proficiency bonus. Characters are assumed proficient with the weapons on their sheet, and
 * magic bonuses / fighting styles aren't known, so the number can be off.
 * TODO: add an explicit attackBonus field to Weapon (needs a lambda change).
 */
export function weaponAttack(weapon: Weapon, character: Character): WeaponAttack {
    const c = withStatDefaults(character);
    const range = weapon.range ?? "";
    const text = `${range} ${weapon.description ?? ""} ${weapon.name ?? ""}`.toLowerCase();
    const isFinesse = /finesse/.test(text);
    const isThrown = /thrown/.test(text);
    const isRanged = !isThrown && (RANGED_WORDS.test(text) || /\d+\s*\/\s*\d+/.test(range));

    const strMod = abilityModifier(c.abilityScores.str);
    const dexMod = abilityModifier(c.abilityScores.dex);
    const ability: "str" | "dex" = isFinesse ? (dexMod > strMod ? "dex" : "str") : isRanged ? "dex" : "str";
    const mod = ability === "dex" ? dexMod : strMod;
    const toHit = mod + proficiencyBonusForLevel(c.level);

    const raw = (weapon.damage ?? "").trim();
    const parsed = parseDiceExpression(raw);
    // A damage string with its own flat modifier ("1d8+3") is used as written.
    const damage = parsed && (/[+-]\s*\d+\s*$/.test(raw) ? parsed : { ...parsed, bonus: mod });

    return {
        ability,
        toHit,
        damage,
        damageLabel: damage ? formatDiceExpression(damage) : raw,
        isMelee: !isRanged,
        isFinesse,
        isRanged,
    };
}
