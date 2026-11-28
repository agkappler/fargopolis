import { getLevelInfoForClass, getRace, LevelInfo } from "@/api/dnd5eapi";
import { MOBILE_BREAK, TABLET_BREAK } from "@/constants/Media";
import { withStatDefaults } from "@/helpers/CharacterStats";
import { formatIndexName } from "@/helpers/Format";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { Box, NativeSelect, Tabs, Text, useMediaQuery } from "@chakra-ui/react";
import { ReactNode } from "react";
import { useState } from "react";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { StyledAccordion } from "../../ui/StyledAccordion";
import { CharacterResources } from "./CharacterResources";
import { ClassFeatures } from "../class/ClassFeatures";
import { RacialTraits } from "../race/RacialTraits";
import { SpellInfo } from "../spells/SpellInfo";
import { WeaponInfo } from "../weapons/WeaponInfo";
import { AbilityInfo } from "../abilities/AbilityInfo";
import { AbilityScoresBlock } from "./AbilityScoresBlock";
import { CombatStatsBlock } from "../CombatStatsBlock";
import { HitPointsSummary } from "../HitPointsSummary";
import { SkillsBlock } from "../SkillsBlock";

interface CharacterInfoProps {
    character: Character;
    /** Opens the character Edit form (used by the stat cards' empty states). */
    onEdit?: () => void;
}

const SummaryChip: React.FC<{ children: ReactNode }> = ({ children }) => (
    <Text as="span" textStyle="label" bg="pine.100" color="pine.700" borderRadius="full" px="2" py="0.5" whiteSpace="nowrap">
        {children}
    </Text>
);

export const CharacterInfo: React.FC<CharacterInfoProps> = ({ character, onEdit }) => {
    const { data: levelInfos, isLoading: isLoadingClassInfo } = useSWR<LevelInfo[]>(`/class/${character.className}/levels`, () => getLevelInfoForClass(character.className));
    // Same keys and fetchers as RacialTraits / CharacterResources, so SWR dedupes these (no extra requests).
    const { data: race } = useSWR(character.race, () => getRace(character.race));
    const { data: resourceIds } = useSWR<(string | number)[]>(
        `/character/${character.characterId}/resourceIds`,
        () => RequestManager.get<(string | number)[]>(`/character/${character.characterId}/resourceIds`),
    );
    const [value, setValue] = useState('1');

    const [isMobile] = useMediaQuery([`(max-width: ${MOBILE_BREAK})`], { fallback: [false] });
    const characterTabs = [
        { label: "Info", value: "1" },
        { label: "Spells", value: "2" },
        { label: "Abilities", value: "3" },
        { label: "Items", value: "4" },
    ];

    const proficientCount = withStatDefaults(character).skillProficiencies.length;
    const subclass = formatIndexName(character.subclassName);
    const spellsKnown = levelInfos?.find(l => l.level === character.level)?.spellcasting?.spells_known;
    const traitCount = Array.isArray(race?.traits) ? race.traits.length : undefined;
    const raceName = race?.name ?? formatIndexName(character.race);
    const fileCount = Array.isArray(resourceIds) ? resourceIds.length : 0;

    const classSummary = (subclass || (typeof spellsKnown === "number" && spellsKnown > 0)) ? <>
        {subclass && <SummaryChip>{subclass}</SummaryChip>}
        {typeof spellsKnown === "number" && spellsKnown > 0 && <SummaryChip>Spells known: {spellsKnown}</SummaryChip>}
    </> : undefined;

    return <>
        <Box
            display="grid"
            gap="4"
            mb="4"
            alignItems="stretch"
            gridTemplateColumns="1.15fr 1fr 1fr"
            css={{
                [`@media (max-width: ${TABLET_BREAK})`]: {
                    gridTemplateColumns: "1fr 1fr",
                    "& > :first-of-type": { gridRow: "span 2" },
                },
                [`@media (max-width: ${MOBILE_BREAK})`]: {
                    gridTemplateColumns: "1fr",
                    "& > :first-of-type": { gridRow: "auto" },
                },
            }}
        >
            <Box minW="0">
                <AbilityScoresBlock character={character} showDefaultsNote />
            </Box>
            <Box minW="0">
                <CombatStatsBlock character={character} onEdit={onEdit} />
            </Box>
            <Box minW="0">
                <HitPointsSummary character={character} onEdit={onEdit} />
            </Box>
        </Box>
        <LoadingWrapper isLoading={isLoadingClassInfo}>
            <Tabs.Root value={value} onValueChange={(e) => setValue(e.value)}>
                <Box borderBottomWidth="1px" borderColor="border" display="flex" justifyContent="center">
                    {isMobile
                        ? <NativeSelect.Root size="lg">
                            <NativeSelect.Field value={value} onChange={(e) => setValue(e.target.value)}>
                                {characterTabs.map((tab) => (
                                    <option key={tab.value} value={tab.value}>{tab.label}</option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        : <Tabs.List aria-label="Character tabs">
                            {characterTabs.map((tab) => (
                                <Tabs.Trigger
                                    key={tab.value}
                                    value={tab.value}
                                    minH="44px"
                                    _selected={{ color: "fg", "--indicator-color": "colors.ember.500" }}
                                >
                                    {tab.label}
                                </Tabs.Trigger>
                            ))}
                        </Tabs.List>}
                </Box>
                <Tabs.Content value="1">
                    <Box>
                        <StyledAccordion title="Skills" summary={`${proficientCount} proficient`}>
                            <SkillsBlock character={character} />
                        </StyledAccordion>

                        <StyledAccordion title="Class Features" summary={classSummary}>
                            <ClassFeatures
                                currentLevel={character.level}
                                className={character.className}
                                characterId={character.characterId}
                            />
                        </StyledAccordion>

                        <StyledAccordion title="Racial Traits" summary={traitCount !== undefined ? `${raceName} · ${traitCount} traits` : undefined}>
                            <RacialTraits
                                race={character.race}
                                characterId={character.characterId}
                            />
                        </StyledAccordion>

                        <StyledAccordion title="Resources" summary={fileCount > 0 ? `${fileCount} file${fileCount === 1 ? "" : "s"}` : undefined}>
                            <CharacterResources characterId={character.characterId} />
                        </StyledAccordion>
                    </Box>
                </Tabs.Content>
                <Tabs.Content value="2">
                    <SpellInfo levelInfos={levelInfos} currentLevel={character.level} className={character.className} characterId={character.characterId} />
                </Tabs.Content>
                <Tabs.Content value="3">
                    <AbilityInfo characterId={character.characterId} canEdit={true} />
                </Tabs.Content>
                <Tabs.Content value="4">
                    <WeaponInfo characterId={character.characterId} />
                </Tabs.Content>
            </Tabs.Root>
        </LoadingWrapper>
    </>
}
