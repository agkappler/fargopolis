import { withStatDefaults } from "@/helpers/CharacterStats";
import Character from "@/models/Character";
import { Box, Flex, Text } from "@chakra-ui/react";
import { StatBox } from "./statBlockShared";

interface HitPointsSummaryProps {
    character: Character;
}

/** Read-only glance at HP for the management view; the editable tracker lives on the Actions page. */
export const HitPointsSummary: React.FC<HitPointsSummaryProps> = ({ character }) => {
    const c = withStatDefaults(character);
    const max = c.hitPoints.max;
    const pct = max > 0 ? Math.min(100, (c.hitPoints.current / max) * 100) : 0;

    return (
        <StatBox title="HP">
            <Flex justify="center" align="baseline" gap="2">
                <Text fontFamily="mono" fontSize="lg">{c.hitPoints.current} / {max}</Text>
                {c.hitPoints.temp > 0 && (
                    <Text textStyle="label" color="fg.muted">+{c.hitPoints.temp} temp</Text>
                )}
            </Flex>
            <Box
                h="4px"
                bg="bg.sunk"
                borderRadius="full"
                mt="1"
                role="progressbar"
                aria-label="Hit points"
                aria-valuenow={c.hitPoints.current}
                aria-valuemin={0}
                aria-valuemax={max}
            >
                <Box h="100%" w={`${pct}%`} bg="brand" borderRadius="full" />
            </Box>
        </StatBox>
    );
};
