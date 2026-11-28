import { getLevelInfoForClass, getSpellDetails, LevelInfo, SpellDetails } from "@/api/dnd5eapi";
import { CharacterSubtitle } from "@/components/dnd/CharacterSubtitle";
import { ActionFilter, ActionFilterBar } from "@/components/dnd/play/ActionFilterBar";
import { ActionSectionCard } from "@/components/dnd/play/ActionSectionCard";
import { ChecksSavesCard } from "@/components/dnd/play/ChecksSavesCard";
import { CombatVitalsCard } from "@/components/dnd/play/CombatVitalsCard";
import { ConditionsPopover } from "@/components/dnd/play/ConditionsPopover";
import { SkillsCard } from "@/components/dnd/play/SkillsCard";
import { SpellSlotsCard } from "@/components/dnd/play/SpellSlotsCard";
import { StatusCard } from "@/components/dnd/play/StatusCard";
import { useHitPointsTracker } from "@/components/dnd/play/useHitPointsTracker";
import { useSpellSlots } from "@/components/dnd/play/useSpellSlots";
import { useRoller, useRollLog } from "@/components/dnd/rolls/rollContext";
import { RollLogProvider } from "@/components/dnd/rolls/RollLogProvider";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ImageBox } from "@/components/ui/ImageBox";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { Condition } from "@/constants/Conditions";
import { PLAY_SHELL_BREAK } from "@/constants/Media";
import {
    ActionRow,
    attacksPerAction,
    groupActions,
    SECTION_ORDER,
    sectionCounts,
    sectionHint,
} from "@/helpers/ActionGrouping";
import RequestManager from "@/helpers/RequestManager";
import { hasAnySlots, ordinal, remaining, slotMaxFromSpellcasting } from "@/helpers/SpellSlots";
import { successToast } from "@/helpers/Toasts";
import Ability from "@/models/Ability";
import Character from "@/models/Character";
import KnownSpell from "@/models/KnownSpell";
import Weapon from "@/models/Weapon";
import { Box, Button, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { ChevronLeft, Moon, ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import useSWR from "swr";

type SpellRow = Extract<ActionRow, { kind: "spell" }>;
type AbilityRow = Extract<ActionRow, { kind: "ability" }>;

const SHELL = `@media (min-width: ${PLAY_SHELL_BREAK})`;

export function CharacterActionsPage() {
    const { id } = useParams();
    const { data: character, isLoading, error } = useSWR<Character>(
        id ? `/character/${id}` : null,
        () => RequestManager.get<Character>(`/character/${id}`),
    );

    if (!id) return <ErrorMessage errorMessage="Missing character id." />;
    if (error) return <ErrorMessage errorMessage={error.message} />;

    return (
        <LoadingWrapper isLoading={isLoading}>
            {character && (
                <RollLogProvider>
                    <PlayView character={character} />
                </RollLogProvider>
            )}
        </LoadingWrapper>
    );
}

const PlayView: React.FC<{ character: Character }> = ({ character }) => {
    const id = character.characterId;
    const { logEvent } = useRoller();
    const { entries, openLog } = useRollLog();

    // Same SWR keys and fetchers as the Detail page, so the cache is shared.
    const { data: weapons } = useSWR<Weapon[]>(
        `/characterWeapons/${id}`,
        () => RequestManager.get<Weapon[]>(`/characterWeapons/${id}`),
    );
    const { data: abilities } = useSWR<Ability[]>(
        `/characterAbilities/${id}`,
        () => RequestManager.get<Ability[]>(`/characterAbilities/${id}`),
    );
    const { data: knownSpellMap } = useSWR<Record<string, KnownSpell>>(
        `/character/${id}/knownSpells`,
        () => RequestManager.get<Record<string, KnownSpell>>(`/character/${id}/knownSpells`),
    );
    const { data: levelInfos } = useSWR<LevelInfo[]>(
        character.className ? `/class/${character.className}/levels` : null,
        () => getLevelInfoForClass(character.className),
    );

    const knownSpells = useMemo(() => Object.values(knownSpellMap ?? {}), [knownSpellMap]);
    const spellKeys = useMemo(() => [...new Set(knownSpells.map(s => s.spellKey))].sort(), [knownSpells]);
    const { data: spellDetails } = useSWR<Record<string, SpellDetails>>(
        spellKeys.length > 0 ? ["spellDetails", ...spellKeys] : null,
        async () => {
            const results = await Promise.allSettled(spellKeys.map(k => getSpellDetails(k)));
            const out: Record<string, SpellDetails> = {};
            results.forEach((r, i) => { if (r.status === "fulfilled") out[spellKeys[i]] = r.value; });
            return out;
        },
    );

    const levelInfo = Array.isArray(levelInfos) ? levelInfos.find(l => l.level === character.level) : undefined;
    const slotMax = useMemo(() => slotMaxFromSpellcasting(levelInfo?.spellcasting), [levelInfo]);

    const tracker = useHitPointsTracker(character);
    const slots = useSpellSlots(id, slotMax);

    // Session-only: lost on reload. Persisting concentration and conditions is issue #43.
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [concentratingOn, setConcentratingOn] = useState<string>();
    const [filter, setFilter] = useState<ActionFilter>("all");

    const grouped = useMemo(() => groupActions({
        weapons: Array.isArray(weapons) ? weapons : [],
        knownSpells,
        spellDetails,
        abilities: Array.isArray(abilities) ? abilities : [],
        character,
    }), [weapons, knownSpells, spellDetails, abilities, character]);
    const counts = sectionCounts(grouped);
    const attacks = attacksPerAction(levelInfos, character.level, Array.isArray(abilities) ? abilities : []);

    const spendFor = (verb: "Cast" | "Use", name: string, minLevel: number, concentration: boolean) => {
        const level = slots.spend(minLevel);
        if (level === undefined) return;
        // `slots.used` is the pre-spend state here, so one fewer remains after this spend.
        const left = remaining(slots.max, slots.used, level) - 1;
        let note = `spent a ${ordinal(level)}-level slot, ${left} left`;
        if (concentration) {
            setConcentratingOn(name);
            note += ` · Concentrating on ${name}`;
        }
        logEvent(`${verb} ${name}`, note);
    };

    const onCast = (row: SpellRow) => {
        const name = row.details?.name ?? row.knownSpell.spellName;
        const level = row.details?.level ?? row.knownSpell.spellLevel ?? 0;
        const concentration = !!row.details?.concentration;
        if (level === 0) {
            if (concentration) setConcentratingOn(name);
            logEvent(`Cast ${name}`, `Cantrip — no slot used${concentration ? ` · Concentrating on ${name}` : ""}`);
            return;
        }
        spendFor("Cast", name, level, concentration);
    };
    const onUseSlot = (row: AbilityRow) => spendFor("Use", row.ability.name, 1, false);

    const onLongRest = () => {
        tracker.longRest();
        slots.restoreAll();
        successToast("Long rest complete — HP and spell slots restored.");
    };

    const toggleCondition = (c: Condition) =>
        setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

    const visibleSections = filter === "all" ? SECTION_ORDER : [filter];

    return (
        <Flex
            direction="column"
            minW="0"
            css={{ [SHELL]: { height: "calc(100dvh - var(--chakra-sizes-fp-nav))", overflow: "hidden" } }}
        >
            <Box flexShrink="0" maxW="fp.container" w="full" mx="auto" px="4" pt="3">
                <CombatVitalsCard
                    character={character}
                    tracker={tracker}
                    header={<>
                        <Flex align="center" gap="2" minW="0" flex="1 1 280px">
                            <Link
                                asChild
                                aria-label="Back to character"
                                title="Back to character"
                                color="brand"
                                display="inline-flex"
                                alignItems="center"
                                justifyContent="center"
                                boxSize="8"
                                flexShrink="0"
                                borderRadius="md"
                                _hover={{ bg: "bg.raised" }}
                            >
                                <RouterLink to={`/dnd/${id}`}><ChevronLeft size={20} aria-hidden="true" /></RouterLink>
                            </Link>
                            <Box flexShrink="0" borderRadius="full" overflow="hidden">
                                <ImageBox fileId={character.avatarId} altText="Character avatar" size={32} />
                            </Box>
                            <Heading
                                as="h1"
                                fontFamily="display"
                                fontWeight="500"
                                fontSize="xl"
                                lineHeight="1.1"
                                truncate
                                flexShrink="0"
                                maxW="50%"
                            >
                                {character.name}
                            </Heading>
                            <Box minW="0" truncate css={{ "& p": { fontSize: "sm" } }}>
                                <CharacterSubtitle character={character} />
                            </Box>
                        </Flex>
                        <Flex gap="1.5" flexWrap="wrap" flexShrink="0">
                            <ConditionsPopover active={conditions} onToggle={toggleCondition} />
                            <Button variant="outline" size="sm" minH="9" onClick={openLog}>
                                <ScrollText size={16} aria-hidden="true" />
                                Roll log ({entries.length})
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                minH="9"
                                disabled={tracker.locked}
                                title={tracker.locked ? "Sign in to track HP" : undefined}
                                onClick={onLongRest}
                            >
                                <Moon size={16} aria-hidden="true" />
                                Long Rest
                            </Button>
                        </Flex>
                    </>}
                />
            </Box>

            <Box
                w="full"
                maxW="fp.container"
                mx="auto"
                px="4"
                pt="3"
                pb="4"
                minW="0"
                display="grid"
                gap="3"
                gridTemplateColumns="minmax(0, 1fr)"
                gridTemplateAreas={'"sideTop" "actions" "sideBottom"'}
                css={{
                    [SHELL]: {
                        flex: "1",
                        minHeight: 0,
                        gridTemplateColumns: "minmax(0, 1fr) 320px",
                        gridTemplateRows: "auto minmax(0, 1fr)",
                        gridTemplateAreas: '"actions sideTop" "actions sideBottom"',
                        columnGap: "16px",
                    },
                }}
            >
                <Flex direction="column" gap="3" gridArea="sideTop" minW="0" css={{ "&:empty": { display: "none" } }}>
                    {(concentratingOn || conditions.length > 0) && (
                        <Box flexShrink="0">
                            <StatusCard
                                concentratingOn={concentratingOn}
                                conditions={conditions}
                                onEndConcentration={() => setConcentratingOn(undefined)}
                                onRemoveCondition={toggleCondition}
                            />
                        </Box>
                    )}
                    {hasAnySlots(slots.max) && (
                        <Box flexShrink="0">
                            <SpellSlotsCard
                                max={slots.max}
                                used={slots.used}
                                onTogglePip={slots.togglePip}
                                flashLevel={slots.flashLevel}
                            />
                        </Box>
                    )}
                </Flex>

                <Box
                    gridArea="actions"
                    minW="0"
                    data-testid="actions-column"
                    css={{ [SHELL]: { overflowY: "auto", minHeight: 0, paddingRight: "4px" } }}
                >
                    <ActionFilterBar value={filter} counts={counts} onChange={setFilter} />
                    <Box pt="1">
                        {counts.all === 0 && filter === "all" ? (
                            <Text fontSize="xs" color="fg.muted" py="6" textAlign="center">
                                No actions yet — add weapons, spells or abilities on the{" "}
                                <Link asChild color="brand"><RouterLink to={`/dnd/${id}`}>character sheet</RouterLink></Link>.
                            </Text>
                        ) : counts[filter] === 0 ? (
                            <Text fontSize="xs" color="fg.muted" py="6" textAlign="center">Nothing in this section.</Text>
                        ) : visibleSections.map(section => (
                            <ActionSectionCard
                                key={section}
                                section={section}
                                groups={grouped[section]}
                                hint={sectionHint(section, attacks)}
                                character={character}
                                slots={slots}
                                onCast={onCast}
                                onUseSlot={onUseSlot}
                            />
                        ))}
                    </Box>
                </Box>

                <Flex
                    direction="column"
                    gap="3"
                    gridArea="sideBottom"
                    minW="0"
                    css={{ [SHELL]: { overflowY: "auto", minHeight: 0 } }}
                >
                    {/* Wrappers keep StatBox's h="full" from stretching each card to the column height. */}
                    <Box flexShrink="0"><ChecksSavesCard character={character} /></Box>
                    <Box flexShrink="0"><SkillsCard character={character} /></Box>
                </Flex>
            </Box>
        </Flex>
    );
};
