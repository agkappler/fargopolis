import { withStatDefaults } from "@/helpers/CharacterStats";
import { formatModifier, passiveScore, proficiencyBonusForLevel } from "@/helpers/DndMath";
import Character from "@/models/Character";
import { RollableStatRow, StatBox, StatRow } from "./statBlockShared";

interface CombatStatsBlockProps {
    character: Character;
}

/** AC/Initiative/Speed/Prof Bonus/Passive Perception — identical read-only reference on both the Details and Actions pages. */
export const CombatStatsBlock: React.FC<CombatStatsBlockProps> = ({ character }) => {
    const c = withStatDefaults(character);
    const pb = proficiencyBonusForLevel(c.level);
    const passivePerception = passiveScore(c.abilityScores.wis, pb, c.skillProficiencies.includes("perception"));

    return (
        <StatBox title="Vitals">
            <StatRow label="AC" value={c.armorClass} />
            <RollableStatRow label="Initiative" modifier={c.initiativeBonus} />
            <StatRow label="Speed" value={`${c.speed} ft`} />
            <StatRow label="Prof. Bonus" value={formatModifier(pb)} />
            <StatRow label="Passive Perception" value={passivePerception} />
        </StatBox>
    );
};
