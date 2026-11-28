import { vitalsAreUnset } from "@/helpers/CharacterEmptyStates";
import { withStatDefaults } from "@/helpers/CharacterStats";
import {
    formatModifier,
    passiveScore,
    proficiencyBonusForLevel,
    spellAttackBonus,
    spellcastingAbilityForClass,
    spellSaveDc,
} from "@/helpers/DndMath";
import Character from "@/models/Character";
import { Grid } from "@chakra-ui/react";
import { RollableStatRow } from "./RollableStatRow";
import { useRoller } from "./rolls/rollContext";
import { StatBox } from "./StatBox";
import { StatEmptyState } from "./StatEmptyState";
import { StatRow } from "./StatRow";
import { RollStatTile, StatTile } from "./StatTile";

interface CombatStatsBlockProps {
    character: Character;
    /** Opens the character Edit form from the empty state. Without it the empty state has no button. */
    onEdit?: () => void;
}

/**
 * Vitals card: AC / Initiative (rollable) / Speed tiles, then Prof. Bonus and Passive Perception,
 * plus Spell Save DC and Spell Attack for spellcasting classes. Shared by the Details and Actions pages.
 */
export const CombatStatsBlock: React.FC<CombatStatsBlockProps> = ({ character, onEdit }) => {
    const { rollD20 } = useRoller();
    if (vitalsAreUnset(character)) {
        return (
            <StatBox title="Vitals">
                <StatEmptyState
                    title="AC, initiative and speed aren't set yet"
                    description="Add them so they show here and on the Play page."
                    actionLabel="Set up vitals"
                    onAction={onEdit}
                />
            </StatBox>
        );
    }

    const c = withStatDefaults(character);
    const pb = proficiencyBonusForLevel(c.level);
    const passivePerception = passiveScore(c.abilityScores.wis, pb, c.skillProficiencies.includes("perception"));
    const init = c.initiativeBonus;
    const spellAbility = spellcastingAbilityForClass(c.className);

    return (
        <StatBox title="Vitals">
            <Grid templateColumns="repeat(3, 1fr)" gap="2" mb="2">
                <StatTile value={c.armorClass > 0 ? c.armorClass : "—"} label="AC" />
                <RollStatTile
                    value={formatModifier(init)}
                    label="Initiative"
                    ariaLabel={`Roll initiative, ${formatModifier(init)}`}
                    onClick={() => rollD20("Initiative", init)}
                />
                <StatTile value={c.speed > 0 ? `${c.speed} ft` : "—"} label="Speed" />
            </Grid>
            <StatRow label="Prof. Bonus" value={formatModifier(pb)} />
            <StatRow label="Passive Perception" value={passivePerception} />
            {spellAbility && (
                <>
                    <StatRow label="Spell Save DC" value={spellSaveDc(c.abilityScores[spellAbility], pb)} />
                    <RollableStatRow
                        label="Spell Attack"
                        modifier={spellAttackBonus(c.abilityScores[spellAbility], pb)}
                    />
                </>
            )}
        </StatBox>
    );
};
