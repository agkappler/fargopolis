import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { PLAY_SHELL_BREAK } from "@/constants/Media";
import { maxHpIsUnset, vitalsAreUnset } from "@/helpers/CharacterEmptyStates";
import { withStatDefaults } from "@/helpers/CharacterStats";
import { formatModifier, passiveScore, proficiencyBonusForLevel } from "@/helpers/DndMath";
import { hpBarColor, hpBarSegments } from "@/helpers/HitPoints";
import Character from "@/models/Character";
import { Box, chakra, Flex, Grid, Popover, Portal, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HpButton } from "../HpButton";
import { useRoller } from "../rolls/rollContext";
import { StatEmptyState } from "../StatEmptyState";
import { RollStatTile, StatTile } from "../StatTile";
import { TempHpPill } from "../TempHpPill";
import { HpKeypad, HpKeypadMode } from "./HpKeypad";
import type { HitPointsTracker } from "./useHitPointsTracker";

interface CombatVitalsCardProps {
    character: Character;
    tracker: HitPointsTracker;
}

const LOCKED_TITLE = "Sign in to track HP";

/** The always-visible combat strip on the Play page: HP tracker + AC / Initiative / Speed / PB / Passive Perception. */
export const CombatVitalsCard: React.FC<CombatVitalsCardProps> = ({ character, tracker }) => {
    const { rollD20 } = useRoller();
    const navigate = useNavigate();
    const [keypadOpen, setKeypadOpen] = useState(false);

    const c = withStatDefaults(character);
    const { hp, locked } = tracker;
    const pb = proficiencyBonusForLevel(c.level);
    const passivePerception = passiveScore(c.abilityScores.wis, pb, c.skillProficiencies.includes("perception"));
    const init = c.initiativeBonus;
    const noVitals = vitalsAreUnset(character);
    const { currentPct, tempPct } = hpBarSegments(hp);

    const onApply = (mode: HpKeypadMode, amount: number) => {
        if (mode === "damage") tracker.damage(amount);
        else if (mode === "heal") tracker.heal(amount);
        else tracker.setTemp(amount);
        setKeypadOpen(false);
    };

    const hpColumn = maxHpIsUnset(character) ? (
        <StatEmptyState
            title="No max HP yet"
            description="Set your max HP on the character sheet to track damage and healing here."
            actionLabel="Open character sheet"
            onAction={() => navigate(`/dnd/${character.characterId}`)}
        />
    ) : (
        <>
            <Flex align="center" justify="space-between" gap="2" mb="1" minH="6">
                <Text textStyle="label" color="fg.muted">Hit Points</Text>
                <TempHpPill temp={hp.temp} />
            </Flex>
            <Flex align="center" justify="center" gap="3" title={locked ? LOCKED_TITLE : undefined}>
                <HpButton
                    label="Take 1 damage"
                    symbol="−"
                    boxSize="11"
                    title={locked ? LOCKED_TITLE : "Take 1 damage"}
                    disabled={locked || hp.current + hp.temp <= 0}
                    onClick={() => tracker.step(-1)}
                />
                <Popover.Root
                    open={keypadOpen}
                    onOpenChange={e => setKeypadOpen(e.open)}
                    positioning={{ placement: "bottom" }}
                    lazyMount
                    unmountOnExit
                >
                    <Popover.Trigger asChild>
                        <chakra.button
                            type="button"
                            aria-label={`Hit points ${hp.current} of ${hp.max}. Open damage and healing keypad`}
                            disabled={locked}
                            fontFamily="mono"
                            fontSize={{ base: "3xl", md: "40px" }}
                            lineHeight="1"
                            px="3"
                            py="1"
                            borderRadius="md"
                            bg="transparent"
                            borderWidth="1px"
                            borderStyle="dashed"
                            borderColor="border.strong"
                            cursor={locked ? "not-allowed" : "pointer"}
                            transition="all 120ms"
                            whiteSpace="nowrap"
                            _hover={locked ? undefined : { bg: "ember.100", borderColor: "ember.500" }}
                            _focusVisible={{ outline: "2px solid", outlineColor: "ember.500", outlineOffset: "2px" }}
                        >
                            {hp.current}
                            <Text as="span" fontSize="0.55em" color="fg.muted">{` / ${hp.max}`}</Text>
                        </chakra.button>
                    </Popover.Trigger>
                    <Portal>
                        <Popover.Positioner>
                            <Popover.Content w="auto" maxW="calc(100vw - 16px)">
                                <Popover.Arrow />
                                <Popover.Body p="3">
                                    <HpKeypad onApply={onApply} />
                                </Popover.Body>
                            </Popover.Content>
                        </Popover.Positioner>
                    </Portal>
                </Popover.Root>
                <HpButton
                    label="Heal 1"
                    symbol="+"
                    boxSize="11"
                    title={locked ? LOCKED_TITLE : "Heal 1"}
                    disabled={locked || hp.current >= hp.max}
                    onClick={() => tracker.step(1)}
                />
            </Flex>
            <Flex
                h="8px"
                bg="bg.sunk"
                borderRadius="full"
                mt="3"
                overflow="hidden"
                role="progressbar"
                aria-label="Hit points"
                aria-valuenow={hp.current}
                aria-valuemin={0}
                aria-valuemax={hp.max}
            >
                <Box h="100%" w={`${currentPct}%`} bg={hpBarColor(hp.current, hp.max)} transition="width 200ms" />
                {tempPct > 0 && <Box h="100%" w={`${tempPct}%`} bg="slate.300" transition="width 200ms" />}
            </Flex>
        </>
    );

    return (
        <Box
            {...surfaceBorderProps}
            p="3"
            display="flex"
            flexDir="column"
            gap="3"
            css={{
                [`@media (min-width: ${PLAY_SHELL_BREAK})`]: { flexDirection: "row", alignItems: "stretch" },
            }}
        >
            <Box
                minW="0"
                display="flex"
                flexDir="column"
                css={{ [`@media (min-width: ${PLAY_SHELL_BREAK})`]: { flex: "0 0 auto", minWidth: "300px" } }}
            >
                {hpColumn}
            </Box>
            <Grid
                flex="1"
                minW="0"
                gap="2"
                alignContent="center"
                templateColumns="repeat(3, minmax(0, 1fr))"
                css={{ [`@media (min-width: ${PLAY_SHELL_BREAK})`]: { gridTemplateColumns: "repeat(5, minmax(0, 1fr))" } }}
            >
                <StatTile value={!noVitals && c.armorClass > 0 ? c.armorClass : "—"} label="AC" />
                <RollStatTile
                    value={formatModifier(init)}
                    label="Initiative"
                    ariaLabel={`Roll initiative, ${formatModifier(init)}`}
                    onClick={() => rollD20("Initiative", init)}
                />
                <StatTile value={!noVitals && c.speed > 0 ? `${c.speed} ft` : "—"} label="Speed" />
                <StatTile value={formatModifier(pb)} label="Prof. Bonus" />
                <StatTile value={passivePerception} label="Passive Perception" />
            </Grid>
        </Box>
    );
};

