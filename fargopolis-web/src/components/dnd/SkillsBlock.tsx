import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { SKILLS } from "@/constants/Skills";
import { withStatDefaults } from "@/helpers/CharacterStats";
import { checkModifier, formatModifier, proficiencyBonusForLevel } from "@/helpers/DndMath";
import Character from "@/models/Character";
import { Box, Button, chakra, SimpleGrid, Text } from "@chakra-ui/react";
import { Dice5 } from "lucide-react";
import { useState } from "react";
import { useRoller } from "./rolls/rollContext";

interface SkillsBlockProps {
    character: Character;
    /**
     * "full" (default, Detail page): 1-3 columns of roomy rows with the ability and a dice icon.
     * "compact" (Play sidebar): two columns of dense chips, proficient skills only unless toggled.
     */
    variant?: "full" | "compact";
    /**
     * Compact only: control "show all 18" from outside (e.g. a toggle in the card header).
     * When set, the inline toggle button below the grid is not rendered.
     */
    showAll?: boolean;
}

const ProfDot: React.FC<{ prof: boolean }> = ({ prof }) => (
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
);

const chipProps = {
    ...surfaceBorderProps,
    bg: "transparent",
    cursor: "pointer",
    transition: "all 120ms",
    _hover: { bg: "ember.100", borderColor: "ember.500" },
    _focusVisible: { outline: "2px solid", outlineColor: "ember.500", outlineOffset: "2px" },
} as const;

export const SkillsBlock: React.FC<SkillsBlockProps> = ({ character, variant = "full", showAll: showAllProp }) => {
    const c = withStatDefaults(character);
    const pb = proficiencyBonusForLevel(c.level);
    const { rollD20 } = useRoller();
    const [showAllState, setShowAll] = useState(false);
    const controlled = showAllProp !== undefined;
    const showAll = controlled ? showAllProp : showAllState;

    const skills = SKILLS.map(s => {
        const prof = c.skillProficiencies.includes(s.key);
        return { ...s, prof, modifier: checkModifier(c.abilityScores[s.ability], pb, prof) };
    });
    const ariaLabel = (s: (typeof skills)[number]) =>
        `Roll ${s.name}, ${formatModifier(s.modifier)}${s.prof ? ", proficient" : ""}`;

    if (variant === "compact") {
        const hasProficient = skills.some(s => s.prof);
        const visible = showAll || !hasProficient ? skills : skills.filter(s => s.prof);
        return (
            <Box>
                <SimpleGrid columns={2} gap="1">
                    {visible.map(s => (
                        <chakra.button
                            key={s.key}
                            type="button"
                            aria-label={ariaLabel(s)}
                            title={s.name}
                            onClick={() => rollD20(s.name, s.modifier)}
                            display="flex"
                            alignItems="center"
                            gap="1.5"
                            px="2"
                            minH="32px"
                            minW="0"
                            fontSize="xs"
                            {...chipProps}
                        >
                            <ProfDot prof={s.prof} />
                            <Text as="span" flex="1" minW="0" textAlign="left" truncate fontWeight={s.prof ? "600" : "400"}>
                                {s.name}
                            </Text>
                            <Text as="span" fontFamily="mono" fontWeight={s.prof ? "600" : "400"} color={s.prof ? "brand" : "fg"}>
                                {formatModifier(s.modifier)}
                            </Text>
                        </chakra.button>
                    ))}
                </SimpleGrid>
                {hasProficient && !controlled && (
                    <Button variant="ghost" size="xs" mt="1" px="1" onClick={() => setShowAll(v => !v)}>
                        {showAll ? "Proficient only" : `Show all ${SKILLS.length}`}
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Box>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap="1.5">
                {skills.map(s => (
                    <chakra.button
                        key={s.key}
                        type="button"
                        className="group"
                        aria-label={ariaLabel(s)}
                        onClick={() => rollD20(s.name, s.modifier)}
                        display="flex"
                        alignItems="center"
                        gap="2"
                        px="2"
                        py="1"
                        minH="40px"
                        {...chipProps}
                    >
                        <ProfDot prof={s.prof} />
                        <Text as="span" fontSize="sm" flex="1" textAlign="left" fontWeight={s.prof ? "600" : "400"}>{s.name}</Text>
                        <Text as="span" textStyle="label" color="fg.muted">{s.ability.toUpperCase()}</Text>
                        <Text
                            as="span"
                            fontFamily="mono"
                            fontWeight={s.prof ? "600" : "400"}
                            color={s.prof ? "brand" : "fg"}
                            minW="3ch"
                            textAlign="right"
                        >
                            {formatModifier(s.modifier)}
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
                ))}
            </SimpleGrid>
        </Box>
    );
};
