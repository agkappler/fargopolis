import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { ABILITY_KEYS, ABILITY_NAMES } from "@/constants/Skills";
import { abilityScoresAreDefault } from "@/helpers/CharacterEmptyStates";
import { withStatDefaults } from "@/helpers/CharacterStats";
import { abilityModifier, checkModifier, formatModifier, proficiencyBonusForLevel } from "@/helpers/DndMath";
import Character from "@/models/Character";
import { Box, Flex, Text } from "@chakra-ui/react";
import { RollCell } from "../RollCell";
import { rowProps } from "../statRowStyle";

interface AbilityScoresBlockProps {
    character: Character;
    /** Show the "Default scores (all 10)" note when the scores are untouched (Detail page only — it has an Edit button). */
    showDefaultsNote?: boolean;
}

const columnLabelProps = { textStyle: "label", color: "fg.muted", textAlign: "center", whiteSpace: "nowrap" } as const;

export const AbilityScoresBlock: React.FC<AbilityScoresBlockProps> = ({ character, showDefaultsNote = false }) => {
    const c = withStatDefaults(character);
    const pb = proficiencyBonusForLevel(c.level);

    return (
        <Box {...surfaceBorderProps} p="3" display="flex" flexDir="column" h="full">
            <Flex justify="space-between" align="center" gap="2" mb="2" minH="6">
                <Text textStyle="label" color="fg.muted">Ability Scores</Text>
                <Flex align="center" gap="1.5" aria-hidden="true">
                    <Box w="10px" h="10px" borderRadius="sm" bg="pine.100" borderWidth="1px" borderStyle="solid" borderColor="pine.300" />
                    <Text textStyle="label" color="fg.muted">tap to roll</Text>
                </Flex>
            </Flex>
            <Flex {...rowProps} borderBottomWidth="0" py="0" mb="1" align="center">
                <Box flex="1" />
                <Flex gap="3">
                    <Text {...columnLabelProps} w="10">Score</Text>
                    <Text {...columnLabelProps} w="14">Mod</Text>
                    <Text {...columnLabelProps} w="14">Save</Text>
                </Flex>
            </Flex>
            {ABILITY_KEYS.map(key => {
                const name = ABILITY_NAMES[key];
                const score = c.abilityScores[key];
                const prof = c.savingThrowProficiencies.includes(key);
                const mod = abilityModifier(score);
                const save = checkModifier(score, pb, prof);
                return (
                    <Flex key={key} {...rowProps}>
                        <Flex flex="1" align="baseline" minW="0" gap="2">
                            <Text textStyle="label" color="fg">{key.toUpperCase()}</Text>
                            <Text fontSize="2xs" color="fg.muted" truncate>{name}</Text>
                        </Flex>
                        <Flex gap="3" align="center">
                            <Text fontFamily="mono" w="10" textAlign="center">{score}</Text>
                            <RollCell
                                label={`${name} check`}
                                modifier={mod}
                                ariaLabel={`Roll ${name} check, ${formatModifier(mod)}`}
                            />
                            <RollCell
                                label={`${name} save`}
                                modifier={save}
                                proficient={prof}
                                ariaLabel={`Roll ${name} save, ${formatModifier(save)}${prof ? ", proficient" : ""}`}
                            />
                        </Flex>
                    </Flex>
                );
            })}
            {showDefaultsNote && abilityScoresAreDefault(character) && (
                <Text mt="auto" pt="2" fontSize="xs" color="fg.muted">
                    Default scores (all 10). Set real scores in Edit.
                </Text>
            )}
        </Box>
    );
};
