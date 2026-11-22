import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { SKILLS } from "@/constants/Skills";
import { withStatDefaults } from "@/helpers/CharacterStats";
import { checkModifier, formatModifier, proficiencyBonusForLevel } from "@/helpers/DndMath";
import { rollD20 } from "@/helpers/Dice";
import { rollToast } from "@/helpers/Toasts";
import Character from "@/models/Character";
import { Box, Flex, SimpleGrid, Text } from "@chakra-ui/react";
import { rollMessage } from "./statBlockShared";

interface SkillsBlockProps {
    character: Character;
}

export const SkillsBlock: React.FC<SkillsBlockProps> = ({ character }) => {
    const c = withStatDefaults(character);
    const pb = proficiencyBonusForLevel(c.level);

    return (
        <Box>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap="1.5">
                {SKILLS.map(s => {
                    const prof = c.skillProficiencies.includes(s.key);
                    const modifier = checkModifier(c.abilityScores[s.ability], pb, prof);
                    const handleRoll = () => {
                        const { roll, total } = rollD20(modifier);
                        rollToast(rollMessage(s.name, modifier, roll, total));
                    };
                    return (
                        <Flex
                            key={s.key}
                            as="button"
                            onClick={handleRoll}
                            align="center"
                            gap="2"
                            px="2"
                            py="1"
                            {...surfaceBorderProps}
                            bg="transparent"
                            cursor="pointer"
                            _hover={{ bg: "bg.sunk" }}
                        >
                            <Box
                                as="span"
                                display="inline-block"
                                w="6px"
                                h="6px"
                                borderRadius="full"
                                flexShrink="0"
                                bg={prof ? "brand" : "transparent"}
                                borderWidth={prof ? "0" : "1px"}
                                borderStyle="solid"
                                borderColor="border.strong"
                                title={prof ? "Proficient" : "Not proficient"}
                                aria-label={prof ? "Proficient" : "Not proficient"}
                            />
                            <Text fontSize="sm" flex="1" textAlign="left">{s.name}</Text>
                            <Text textStyle="label" color="fg.muted">{s.ability.toUpperCase()}</Text>
                            <Text fontFamily="mono" color={prof ? "brand" : "fg"} minW="3ch" textAlign="right">
                                {formatModifier(modifier)}
                            </Text>
                        </Flex>
                    );
                })}
            </SimpleGrid>
        </Box>
    );
};
