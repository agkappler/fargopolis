import { formatModifier } from "@/helpers/DndMath";
import { hasAnySlots, ordinal, SlotLevels } from "@/helpers/SpellSlots";
import { Box, chakra, Flex, Text } from "@chakra-ui/react";
import { useRoller } from "../rolls/rollContext";
import { rollButtonProps } from "../rollStyle";
import { StatBox } from "../StatBox";

/** Spell save DC and spell attack bonus for the character's spellcasting ability. */
export interface CastingStats {
    /** Short ability label, e.g. "INT". */
    ability: string;
    saveDc: number;
    attackBonus: number;
}

interface SpellSlotsCardProps {
    max: SlotLevels;
    used: SlotLevels;
    onTogglePip: (level: number, pipIndex: number) => void;
    /** Level that was just spent; its row flashes briefly. */
    flashLevel?: number;
    /** When set, the header shows the spell save DC and a spell attack roll button. */
    casting?: CastingStats;
}

/** Sidebar spell slots: a compact two-column grid of levels with tappable pips (filled = available). */
export const SpellSlotsCard: React.FC<SpellSlotsCardProps> = ({ max, used, onTogglePip, flashLevel, casting }) => {
    const { rollD20 } = useRoller();
    if (!hasAnySlots(max)) return null;
    const levels = max.map((m, i) => ({ level: i + 1, max: m, used: used[i] ?? 0 })).filter(l => l.max > 0);
    const total = levels.reduce((n, l) => n + l.max, 0);
    const left = levels.reduce((n, l) => n + l.max - l.used, 0);

    return (
        <StatBox
            title="Spell Slots"
            headerRight={
                <Flex align="center" gap="1.5">
                    {casting && (
                        <>
                            <Text
                                as="span"
                                fontFamily="mono"
                                fontSize="2xs"
                                px="2"
                                h="6"
                                display="inline-flex"
                                alignItems="center"
                                borderRadius="full"
                                bg="bg.sunk"
                                color="fg.secondary"
                                whiteSpace="nowrap"
                                title={`Spell save DC (${casting.ability})`}
                            >
                                DC {casting.saveDc}
                            </Text>
                            <chakra.button
                                type="button"
                                {...rollButtonProps}
                                fontFamily="mono"
                                fontSize="2xs"
                                px="2"
                                h="6"
                                borderRadius="full"
                                whiteSpace="nowrap"
                                aria-label={`Roll spell attack, ${formatModifier(casting.attackBonus)}`}
                                title={`Spell attack (${casting.ability})`}
                                onClick={() => rollD20("Spell attack", casting.attackBonus)}
                            >
                                Atk {formatModifier(casting.attackBonus)}
                            </chakra.button>
                        </>
                    )}
                    <Text fontFamily="mono" fontSize="2xs" color="fg.muted" title="Slots left">{left}/{total}</Text>
                </Flex>
            }
        >
            <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="1">
                {levels.map(l => (
                    <Flex
                        key={l.level}
                        data-testid={`slot-level-${l.level}`}
                        data-flash={flashLevel === l.level ? "true" : undefined}
                        align="center"
                        gap="2"
                        px="1.5"
                        py="1"
                        borderRadius="md"
                        minW="0"
                        bg={flashLevel === l.level ? "ember.100" : "transparent"}
                        transition="background-color 200ms"
                    >
                        <Text textStyle="label" color="fg.muted" minW="9" whiteSpace="nowrap" flexShrink="0">{ordinal(l.level)}</Text>
                        <Flex gap="1" flexWrap="wrap" minW="0">
                            {Array.from({ length: l.max }, (_, i) => {
                                const spent = i < l.used;
                                return (
                                    <chakra.button
                                        key={i}
                                        type="button"
                                        aria-label={`${ordinal(l.level)}-level slot ${i + 1} of ${l.max}, ${spent ? "spent. Tap to restore" : "available. Tap to spend"}`}
                                        onClick={() => onTogglePip(l.level, i)}
                                        w="14px"
                                        h="14px"
                                        p="0"
                                        borderRadius="full"
                                        borderWidth="1.5px"
                                        borderStyle="solid"
                                        borderColor={spent ? "border.strong" : "pine.500"}
                                        bg={spent ? "transparent" : "pine.500"}
                                        cursor="pointer"
                                        transition="all 120ms"
                                        _hover={{ borderColor: "ember.500" }}
                                        _focusVisible={{ outline: "2px solid", outlineColor: "ember.500", outlineOffset: "1px" }}
                                    />
                                );
                            })}
                        </Flex>
                    </Flex>
                ))}
            </Box>
        </StatBox>
    );
};
