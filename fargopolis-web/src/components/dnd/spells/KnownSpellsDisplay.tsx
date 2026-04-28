import { getSpellsForClass, BaseDndResponse, Spell } from "@/api/dnd5eapi";
import RequestManager from "@/helpers/RequestManager";
import KnownSpell from "@/models/KnownSpell";
import { Grid, Typography, Box } from "@mui/material";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { SpellCard } from "./SpellCard";

interface KnownSpellsDisplayProps {
    characterId: string;
    className: string;
    canEdit: boolean;
    onSpellUpdate?: () => void;
}

export const KnownSpellsDisplay: React.FC<KnownSpellsDisplayProps> = ({
    characterId,
    className,
    canEdit,
    onSpellUpdate
}) => {
    const { data: spellData, isLoading: isLoadingSpells } = useSWR<BaseDndResponse>(
        `/spells/${className}`,
        () => getSpellsForClass(className)
    );

    const { data: knownSpells, isLoading: isLoadingKnownSpells, mutate } = useSWR<Record<string, KnownSpell>>(
        `/character/${characterId}/knownSpells`,
        () => RequestManager.getGateway<Record<string, KnownSpell>>(`/character/${characterId}/knownSpells`),
    );

    const spellsByLevel = (spellData?.results as Spell[])?.reduce((acc, spell) => {
        const key = spell.level;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(spell);
        return acc;
    }, {} as Record<number, Spell[]>);

    const getKnownSpellsByLevel = (knownSpells: Record<string, KnownSpell>): Record<number, Spell[]> => {
        const validSpells = Object.keys(knownSpells)
            .map(s => spellsByLevel?.[knownSpells[s].spellLevel]?.find(spell => spell.index === knownSpells[s].spellKey))
            .filter((spell): spell is Spell => spell !== undefined);

        return validSpells.reduce((acc, spell) => {
            const level = spell.level;
            if (!acc[level]) {
                acc[level] = [];
            }
            acc[level].push(spell);
            return acc;
        }, {} as Record<number, Spell[]>);
    };

    const handleSpellUpdate = () => {
        mutate();
        onSpellUpdate?.();
    };

    const knownSpellsByLevel = knownSpells ? getKnownSpellsByLevel(knownSpells) : {};
    const spellLevels = Object.keys(knownSpellsByLevel).map(Number).sort((a, b) => a - b);

    return (
        <LoadingWrapper isLoading={isLoadingKnownSpells || isLoadingSpells}>
            {spellLevels.length > 0 ? (
                <Grid container spacing={2}>
                    {spellLevels.map(spellLevel => (
                        <Grid key={spellLevel} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Box>
                                <Typography variant="h6" gutterBottom textAlign="center">
                                    {spellLevel === 0 ? 'Cantrips' : `Level ${spellLevel}`}
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={1}>
                                    {knownSpellsByLevel[spellLevel].map(spell => (
                                        <SpellCard
                                            key={spell.index}
                                            spell={spell}
                                            canEdit={canEdit}
                                            characterId={characterId}
                                            isKnown={true}
                                            onSpellUpdate={handleSpellUpdate}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography textAlign="center">No known spells.</Typography>
            )}
        </LoadingWrapper>
    );
};
