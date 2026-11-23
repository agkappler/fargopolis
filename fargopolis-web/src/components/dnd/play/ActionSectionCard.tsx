import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { ActionRow, EconomySection, SECTION_LABELS, SectionGroups, sectionSize } from "@/helpers/ActionGrouping";
import Character from "@/models/Character";
import { Box, Flex, Text } from "@chakra-ui/react";
import { AbilityActionRow, SpellActionRow, WeaponActionRow } from "./ActionRows";
import type { SpellSlotsState } from "./useSpellSlots";

type SpellRow = Extract<ActionRow, { kind: "spell" }>;
type AbilityRow = Extract<ActionRow, { kind: "ability" }>;

interface ActionSectionCardProps {
    section: EconomySection;
    groups: SectionGroups;
    hint?: string;
    character: Character;
    slots: SpellSlotsState;
    onCast: (row: SpellRow) => void;
    onUseSlot: (row: AbilityRow) => void;
}

const pillTone: Record<EconomySection, { bg: string; color: string; borderColor: string }> = {
    action: { bg: "pine.100", color: "pine.700", borderColor: "transparent" },
    bonus: { bg: "ember.100", color: "ember.700", borderColor: "transparent" },
    reaction: { bg: "bg.raised", color: "slate.700", borderColor: "slate.300" },
    passive: { bg: "stone.50", color: "ink.600", borderColor: "transparent" },
};

const GROUPS = [
    { key: "weapons", label: "Weapons" },
    { key: "spells", label: "Spells" },
    { key: "abilities", label: "Abilities" },
] as const;

/** One action-economy section (Action / Bonus Action / Reaction / Passive & Free), rows grouped by source. */
export const ActionSectionCard: React.FC<ActionSectionCardProps> = ({ section, groups, hint, character, slots, onCast, onUseSlot }) => {
    if (sectionSize(groups) === 0) return null;

    const renderRow = (row: ActionRow) => {
        switch (row.kind) {
            case "weapon":
            case "opportunity":
                return <WeaponActionRow key={row.id} row={row} character={character} />;
            case "spell":
                return <SpellActionRow key={row.id} row={row} slots={slots} onCast={onCast} />;
            case "ability":
                return <AbilityActionRow key={row.id} row={row} slots={slots} onUseSlot={onUseSlot} />;
        }
    };

    return (
        <Box as="section" aria-label={SECTION_LABELS[section]} {...surfaceBorderProps} p="3" mb="3" minW="0">
            <Flex align="center" gap="2" flexWrap="wrap" mb="1">
                <Text
                    as="h2"
                    m="0"
                    textStyle="label"
                    px="2"
                    py="0.5"
                    borderRadius="full"
                    borderWidth="1px"
                    borderStyle="solid"
                    {...pillTone[section]}
                >
                    {SECTION_LABELS[section]}
                </Text>
                {hint && <Text fontSize="2xs" color="fg.muted">{hint}</Text>}
            </Flex>
            {GROUPS.filter(g => groups[g.key].length > 0).map(g => (
                <Box key={g.key} mt="2">
                    <Text textStyle="label" fontSize="10px" color="fg.subtle" mb="0.5">{g.label}</Text>
                    <Box as="ul" listStyleType="none" m="0" p="0">
                        {groups[g.key].map(renderRow)}
                    </Box>
                </Box>
            ))}
        </Box>
    );
};
