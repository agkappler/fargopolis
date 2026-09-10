import { BaseDndResponse, getSpellsForClass, LevelInfo, Spell } from "@/api/dnd5eapi";
import { Badge, Box, Grid, GridItem, Heading, Text } from "@chakra-ui/react";
import useSWR from "swr";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { SpellCard } from "./SpellCard";
import { SpellSlotTable } from "./SpellSlotTable";
import { KnownSpellsDisplay } from "./KnownSpellsDisplay";
import KnownSpell from "@/models/KnownSpell";
import RequestManager from "@/helpers/RequestManager";

interface SpellInfoProps {
    levelInfos: LevelInfo[] | undefined;
    currentLevel: number;
    className: string;
    characterId: string;
}

export const SpellInfo: React.FC<SpellInfoProps> = ({ levelInfos, currentLevel, className, characterId }) => {
    const { data: spellData, isLoading } = useSWR<BaseDndResponse>(`/spells/${className}`, () => getSpellsForClass(className));
    const { data: knownSpells, mutate } = useSWR<Record<string, KnownSpell>>(
        `/character/${characterId}/knownSpells`,
        () => RequestManager.get<Record<string, KnownSpell>>(`/character/${characterId}/knownSpells`),
    );

    if (levelInfos === undefined) return <ErrorMessage errorMessage="Missing level data." />;
    const spellcasting = levelInfos.find(l => l.level === currentLevel)?.spellcasting;
    if (spellcasting === undefined) return <Text>No spells yet!</Text>;
    // const maxSpellLevel = 3;
    const spellLevels = Array.from({ length: 10 }, (_, i) => i);
    const hasSpellSlotAtLevel = (spellLevel: number) => {
        const slotKey = `spell_slots_level_${spellLevel}` as keyof typeof spellcasting;
        return (spellLevel === 0 && spellcasting.cantrips_known > 0) ||
            (spellcasting && spellcasting[slotKey] !== undefined && (spellcasting[slotKey] as number) > 0);
    }
    const spellsByLevel = (spellData?.results as Spell[])?.reduce((acc, spell) => {
        const key = spell.level;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(spell);
        return acc;
    }, {} as Record<number, Spell[]>);


    return <>
        <SpellSlotTable spellSlots={spellcasting} />
        <Heading size="md" textAlign="center" marginTop={2} marginBottom={1}>Known Spells</Heading>
        <Box display="flex" justifyContent="center" gap={3}>
            <Badge>{`Cantrips: ${spellcasting.cantrips_known}`}</Badge>
            <Badge>{`Spells: ${spellcasting.spells_known}`}</Badge>
        </Box>
        <KnownSpellsDisplay
            characterId={characterId}
            className={className}
            canEdit={false}
            onSpellUpdate={mutate}
        />
        <Heading size="md" textAlign="center" marginTop={2}>Available Spells</Heading>
        <LoadingWrapper isLoading={isLoading}>
            {spellLevels.map(spellLevel => (<Box key={spellLevel}>
                <Heading size="md" marginTop={2}>{spellLevel === 0 ? 'Cantrips' : `Level ${spellLevel} Spells`}</Heading>
                <Grid templateColumns="repeat(12, 1fr)" gap={4}>
                    {(spellsByLevel?.[spellLevel] ?? []).map((spell, index) => (
                        <GridItem key={index} colSpan={{ base: 12, sm: 6, md: 3 }}>
                            <SpellCard
                                spell={spell}
                                isKnown={knownSpells?.[spell.index] !== undefined}
                                canEdit={hasSpellSlotAtLevel(spellLevel)}
                                characterId={characterId}
                                onSpellUpdate={mutate}
                            />
                        </GridItem>
                    ))}
                </Grid>
            </Box>))}
        </LoadingWrapper>

        {/* <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2}>
            <Chip label={`Cantrips <br> ${currentSpellSlots.cantrips_known}`} />
            <Chip label={<>Level 1<br />{currentSpellSlots.spell_slots_level_1}</>} />
            <Chip label={`Level 2: ${currentSpellSlots.spell_slots_level_2}`} />
            <Chip label={`Level 3: ${currentSpellSlots.spell_slots_level_3}`} />
            <Chip label={`Level 4: ${ currentSpellSlots.spell_slots_level_4}`} />
            <Chip label={`Level 5: ${currentSpellSlots.spell_slots_level_5}`} />
            <Chip label={`Level 6: ${currentSpellSlots.spell_slots_level_6}`} />
            <Chip label={`Level 7: ${currentSpellSlots.spell_slots_level_7}`} />
            <Chip label={`Level 8: ${currentSpellSlots.spell_slots_level_8}`} />
            <Chip label={`Level 9: ${currentSpellSlots.spell_slots_level_9}`} />
        </Box> */}
    </>
}