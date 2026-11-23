import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { SKILLS } from "@/constants/Skills";
import { withStatDefaults } from "@/helpers/CharacterStats";
import { checkModifier, formatModifier, proficiencyBonusForLevel } from "@/helpers/DndMath";
import Character from "@/models/Character";
import { Box, chakra, SimpleGrid, Text } from "@chakra-ui/react";
import { Dice5 } from "lucide-react";
import { rollAndToast } from "./roll";

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
                    return (
                        <chakra.button
                            key={s.key}
                            type="button"
                            className="group"
                            aria-label={`Roll ${s.name}, ${formatModifier(modifier)}${prof ? ", proficient" : ""}`}
                            onClick={() => rollAndToast(s.name, modifier)}
                            display="flex"
                            alignItems="center"
                            gap="2"
                            px="2"
                            py="1"
                            minH="40px"
                            {...surfaceBorderProps}
                            bg="transparent"
                            cursor="pointer"
                            transition="all 120ms"
                            _hover={{ bg: "ember.100", borderColor: "ember.500" }}
                            _focusVisible={{ outline: "2px solid", outlineColor: "ember.500", outlineOffset: "2px" }}
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
                                aria-hidden="true"
                            />
                            <Text as="span" fontSize="sm" flex="1" textAlign="left" fontWeight={prof ? "600" : "400"}>{s.name}</Text>
                            <Text as="span" textStyle="label" color="fg.muted">{s.ability.toUpperCase()}</Text>
                            <Text
                                as="span"
                                fontFamily="mono"
                                fontWeight={prof ? "600" : "400"}
                                color={prof ? "brand" : "fg"}
                                minW="3ch"
                                textAlign="right"
                            >
                                {formatModifier(modifier)}
                            </Text>
                            <Box
                                as="span"
                                display="inline-flex"
                                color="fg.subtle"
                                opacity={0.5}
                                transition="all 120ms"
                                _groupHover={{ opacity: 1, color: "accent" }}
                                aria-hidden="true"
                            >
                                <Dice5 size={14} />
                            </Box>
                        </chakra.button>
                    );
                })}
            </SimpleGrid>
        </Box>
    );
};
