import { PLAY_SHELL_BREAK } from "@/constants/Media";
import { EconomySection, SECTION_LABELS, SECTION_ORDER } from "@/helpers/ActionGrouping";
import { chakra, Flex, Text } from "@chakra-ui/react";

export type ActionFilter = "all" | EconomySection;

interface ActionFilterBarProps {
    value: ActionFilter;
    counts: Record<ActionFilter, number>;
    onChange: (value: ActionFilter) => void;
}

const FILTERS: { value: ActionFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...SECTION_ORDER.map(s => ({ value: s, label: SECTION_LABELS[s] })),
];

/** Economy filter pills, sticky at the top of the actions column. */
export const ActionFilterBar: React.FC<ActionFilterBarProps> = ({ value, counts, onChange }) => (
    <Flex
        role="toolbar"
        aria-label="Filter actions"
        position="sticky"
        // Below the shell breakpoint the page scrolls, so stick under the sticky navbar (fp.nav).
        top="var(--chakra-sizes-fp-nav, 56px)"
        zIndex="1"
        bg="bg"
        gap="1.5"
        py="2"
        overflowX="auto"
        flexWrap="nowrap"
        css={{ [`@media (min-width: ${PLAY_SHELL_BREAK})`]: { top: 0 } }}
    >
        {FILTERS.map(f => {
            const active = f.value === value;
            return (
                <chakra.button
                    key={f.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(f.value)}
                    display="inline-flex"
                    alignItems="center"
                    gap="1.5"
                    flexShrink="0"
                    whiteSpace="nowrap"
                    px="3"
                    minH="8"
                    borderRadius="full"
                    borderWidth="1px"
                    borderStyle="solid"
                    fontSize="xs"
                    cursor="pointer"
                    transition="all 120ms"
                    bg={active ? "pine.700" : "bg.raised"}
                    color={active ? "parchment.0" : "fg.secondary"}
                    borderColor={active ? "pine.700" : "border"}
                    _hover={active ? undefined : { borderColor: "ember.500", color: "ember.700" }}
                    _focusVisible={{ outline: "2px solid", outlineColor: "ember.500", outlineOffset: "2px" }}
                >
                    {f.label}
                    <Text as="span" fontFamily="mono" fontSize="2xs" opacity={0.8}>{counts[f.value]}</Text>
                </chakra.button>
            );
        })}
    </Flex>
);
