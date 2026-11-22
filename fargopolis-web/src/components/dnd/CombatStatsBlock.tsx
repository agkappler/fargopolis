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
import { chakra, Flex, Grid, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
import { rollAndToast } from "./roll";
import { RollableStatRow } from "./RollableStatRow";
import { rollButtonProps } from "./rollStyle";
import { StatBox } from "./StatBox";
import { StatEmptyState } from "./StatEmptyState";
import { StatRow } from "./StatRow";

interface CombatStatsBlockProps {
    character: Character;
    /** Opens the character Edit form from the empty state. Without it the empty state has no button. */
    onEdit?: () => void;
}

const tileProps = {
    display: "flex",
    flexDir: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1",
    minH: "16",
    py: "2",
    px: "1",
    borderRadius: "md",
} as const;

const TileValue: React.FC<{ children: ReactNode }> = ({ children }) => (
    <Text as="span" fontFamily="mono" fontSize="24px" lineHeight="1">{children}</Text>
);
const TileLabel: React.FC<{ children: ReactNode }> = ({ children }) => (
    <Text as="span" textStyle="label" color="fg.muted">{children}</Text>
);

/**
 * Vitals card: AC / Initiative (rollable) / Speed tiles, then Prof. Bonus and Passive Perception,
 * plus Spell Save DC and Spell Attack for spellcasting classes. Shared by the Details and Actions pages.
 */
export const CombatStatsBlock: React.FC<CombatStatsBlockProps> = ({ character, onEdit }) => {
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
                <Flex {...tileProps} bg="bg.sunk">
                    <TileValue>{c.armorClass > 0 ? c.armorClass : "—"}</TileValue>
                    <TileLabel>AC</TileLabel>
                </Flex>
                <chakra.button
                    type="button"
                    aria-label={`Roll initiative, ${formatModifier(init)}`}
                    onClick={() => rollAndToast("Initiative", init)}
                    {...rollButtonProps}
                    {...tileProps}
                >
                    <TileValue>{formatModifier(init)}</TileValue>
                    <TileLabel>Initiative</TileLabel>
                </chakra.button>
                <Flex {...tileProps} bg="bg.sunk">
                    <TileValue>{c.speed > 0 ? `${c.speed} ft` : "—"}</TileValue>
                    <TileLabel>Speed</TileLabel>
                </Flex>
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
