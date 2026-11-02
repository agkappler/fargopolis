import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { ABILITY_KEYS, SKILLS } from "@/constants/Skills";
import { withStatDefaults } from "@/helpers/CharacterStats";
import { checkModifier, formatModifier, proficiencyBonusForLevel } from "@/helpers/DndMath";
import Character from "@/models/Character";
import { Box, Flex, SimpleGrid, Text } from "@chakra-ui/react";

interface ProficiencyBlockProps {
    character: Character;
}

export const ProficiencyBlock: React.FC<ProficiencyBlockProps> = ({ character }) => {
    const c = withStatDefaults(character);
    const pb = proficiencyBonusForLevel(c.level);

    return (
        <Box>
            <Text textStyle="label" color="fg.muted" mb="2">Saving Throws</Text>
            <SimpleGrid columns={{ base: 3, md: 6 }} gap="2">
                {ABILITY_KEYS.map(key => {
                    const prof = c.savingThrowProficiencies.includes(key);
                    return (
                        <Box
                            key={key}
                            {...surfaceBorderProps}
                            p="2"
                            textAlign="center"
                            borderColor={prof ? "pine.500" : "border"}
                            borderTopWidth={prof ? "3px" : "1px"}
                        >
                            <Text textStyle="label">{key.toUpperCase()}</Text>
                            <Text fontFamily="mono" fontSize="lg" color={prof ? "brand" : "fg"}>
                                {formatModifier(checkModifier(c.abilityScores[key], pb, prof))}
                            </Text>
                        </Box>
                    );
                })}
            </SimpleGrid>

            <Text textStyle="label" color="fg.muted" mt="4" mb="2">Skills</Text>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap="1.5">
                {SKILLS.map(s => {
                    const prof = c.skillProficiencies.includes(s.key);
                    return (
                        <Flex key={s.key} align="center" gap="2" px="2" py="1" {...surfaceBorderProps}>
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
                            <Text fontSize="sm" flex="1">{s.name}</Text>
                            <Text textStyle="label" color="fg.muted">{s.ability.toUpperCase()}</Text>
                            <Text fontFamily="mono" color={prof ? "brand" : "fg"} minW="3ch" textAlign="right">
                                {formatModifier(checkModifier(c.abilityScores[s.ability], pb, prof))}
                            </Text>
                        </Flex>
                    );
                })}
            </SimpleGrid>
        </Box>
    );
};
