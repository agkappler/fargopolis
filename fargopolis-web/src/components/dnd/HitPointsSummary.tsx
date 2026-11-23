import { maxHpIsUnset } from "@/helpers/CharacterEmptyStates";
import { withStatDefaults } from "@/helpers/CharacterStats";
import Character from "@/models/Character";
import { Box, Flex, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { StatBox } from "./StatBox";
import { StatEmptyState } from "./StatEmptyState";
import { TempHpPill } from "./TempHpPill";

interface HitPointsSummaryProps {
    character: Character;
    /** Opens the character Edit form from the empty state. Without it the empty state has no button. */
    onEdit?: () => void;
}

/** Read-only glance at HP for the management view; the editable tracker lives on the Actions (Play) page. */
export const HitPointsSummary: React.FC<HitPointsSummaryProps> = ({ character, onEdit }) => {
    const c = withStatDefaults(character);
    const { current, max, temp } = c.hitPoints;
    const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

    const tempPill = temp > 0 ? <TempHpPill temp={temp} /> : undefined;

    return (
        <StatBox title="HP" headerRight={tempPill}>
            {maxHpIsUnset(character) ? (
                <StatEmptyState
                    title="No max HP yet"
                    description="Set your max HP to track damage and healing on the Play page."
                    actionLabel="Set max HP"
                    onAction={onEdit}
                />
            ) : (
                <>
                    <Flex justify="center" align="baseline" gap="1" py="2">
                        <Text fontFamily="mono" fontSize="40px" lineHeight="1">{current}</Text>
                        <Text fontFamily="mono" fontSize="20px" lineHeight="1" color="fg.muted">/ {max}</Text>
                    </Flex>
                    <Box
                        h="8px"
                        bg="bg.sunk"
                        borderRadius="full"
                        mt="2"
                        overflow="hidden"
                        role="progressbar"
                        aria-label="Hit points"
                        aria-valuenow={current}
                        aria-valuemin={0}
                        aria-valuemax={max}
                    >
                        <Box h="100%" w={`${pct}%`} bg="brand" borderRadius="full" />
                    </Box>
                </>
            )}
            <Box mt="auto" pt="3">
                <Link
                    asChild
                    color="brand"
                    fontSize="xs"
                    textDecoration="none"
                    _hover={{ color: "accent.hover", textDecoration: "underline" }}
                >
                    <RouterLink to={`/dnd/${character.characterId}/actions`}>Track HP on the Play page →</RouterLink>
                </Link>
            </Box>
        </StatBox>
    );
};
