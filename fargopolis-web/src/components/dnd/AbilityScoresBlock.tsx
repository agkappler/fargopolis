import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { ABILITY_KEYS } from "@/constants/Skills";
import { withStatDefaults } from "@/helpers/CharacterStats";
import { abilityModifier, checkModifier, proficiencyBonusForLevel } from "@/helpers/DndMath";
import Character from "@/models/Character";
import { Box, Flex, Text } from "@chakra-ui/react";
import { RollCell } from "./RollCell";
import { rowProps } from "./statRowStyle";

interface AbilityScoresBlockProps {
    character: Character;
}

export const AbilityScoresBlock: React.FC<AbilityScoresBlockProps> = ({ character }) => {
    const c = withStatDefaults(character);
    const pb = proficiencyBonusForLevel(c.level);

    return (
        <Box {...surfaceBorderProps} p="3">
            <Flex {...rowProps} borderBottomWidth="0" py="0" mb="2" align="center">
                <Text textStyle="label" color="fg.muted" flex="1">Ability Scores</Text>
                <Flex gap="4">
                    <Text textStyle="label" color="fg.muted" w="12" textAlign="right" whiteSpace="nowrap">Score</Text>
                    <Text textStyle="label" color="fg.muted" w="9" textAlign="right" whiteSpace="nowrap">Mod</Text>
                    <Text textStyle="label" color="fg.muted" w="9" textAlign="right" whiteSpace="nowrap">Save</Text>
                </Flex>
            </Flex>
            {ABILITY_KEYS.map(key => {
                const score = c.abilityScores[key];
                const prof = c.savingThrowProficiencies.includes(key);
                return (
                    <Flex key={key} {...rowProps}>
                        <Text textStyle="label" flex="1">{key.toUpperCase()}</Text>
                        <Flex gap="4" align="center">
                            <Text fontFamily="mono" w="12" textAlign="right">{score}</Text>
                            <RollCell label={`${key.toUpperCase()} Check`} modifier={abilityModifier(score)} color="brand" />
                            <RollCell label={`${key.toUpperCase()} Save`} modifier={checkModifier(score, pb, prof)} color={prof ? "brand" : "fg"} />
                        </Flex>
                    </Flex>
                );
            })}
        </Box>
    );
};
