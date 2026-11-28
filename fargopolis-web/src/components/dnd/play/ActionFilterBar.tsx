import { PLAY_SHELL_BREAK } from "@/constants/Media";
import { EconomySection, SECTION_LABELS, SECTION_ORDER } from "@/helpers/ActionGrouping";
import { Box, chakra, Flex, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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

/** Fade + arrow shown on an edge of the pill row when more pills are hidden past it. */
const ScrollHint: React.FC<{ side: "left" | "right"; onClick: () => void }> = ({ side, onClick }) => (
    <Flex
        position="absolute"
        top="0"
        bottom="0"
        {...{ [side]: 0 }}
        w="12"
        align="center"
        justify={side === "left" ? "flex-start" : "flex-end"}
        pointerEvents="none"
        css={{
            background: `linear-gradient(to ${side === "left" ? "right" : "left"}, var(--chakra-colors-bg) 40%, transparent)`,
        }}
    >
        <chakra.button
            type="button"
            aria-label={side === "left" ? "Scroll filters left" : "Scroll filters right"}
            onClick={onClick}
            pointerEvents="auto"
            boxSize="7"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="full"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="border"
            bg="bg.raised"
            color="fg.secondary"
            boxShadow="sm"
            cursor="pointer"
            _hover={{ borderColor: "ember.500", color: "ember.700" }}
            _focusVisible={{ outline: "2px solid", outlineColor: "ember.500", outlineOffset: "2px" }}
        >
            {side === "left" ? <ChevronLeft size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
        </chakra.button>
    </Flex>
);

/** Economy filter pills, sticky at the top of the actions column. Scrolls sideways when they don't fit. */
export const ActionFilterBar: React.FC<ActionFilterBarProps> = ({ value, counts, onChange }) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ left: false, right: false });

    const measure = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const left = el.scrollLeft > 2;
        const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
        setEdges(prev => (prev.left === left && prev.right === right ? prev : { left, right }));
    }, []);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [measure]);

    const scrollBy = (dx: number) => scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });

    return (
        <Box
            position="sticky"
            // Below the shell breakpoint the page scrolls, so stick under the sticky navbar (fp.nav).
            top="var(--chakra-sizes-fp-nav, 56px)"
            zIndex="1"
            bg="bg"
            css={{ [`@media (min-width: ${PLAY_SHELL_BREAK})`]: { top: 0 } }}
        >
            <Flex
                ref={scrollerRef}
                role="toolbar"
                aria-label="Filter actions"
                onScroll={measure}
                gap="1.5"
                py="2"
                overflowX="auto"
                flexWrap="nowrap"
                css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
            >
                {FILTERS.map(f => {
                    const active = f.value === value;
                    return (
                        <chakra.button
                            key={f.value}
                            type="button"
                            aria-pressed={active}
                            onClick={e => {
                                onChange(f.value);
                                e.currentTarget.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
                            }}
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
            {edges.left && <ScrollHint side="left" onClick={() => scrollBy(-160)} />}
            {edges.right && <ScrollHint side="right" onClick={() => scrollBy(160)} />}
        </Box>
    );
};
