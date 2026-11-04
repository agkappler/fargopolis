import { BaseDndResponse, getSpellsForClass, Spell, Spellcasting } from "@/api/dnd5eapi";
import { Badge, Box, chakra, Flex, Text } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { castableSpellLevels, CharacterWizardValues } from "./wizardConfig";

interface SpellsStepProps {
    className: string;
    spellcasting?: Spellcasting;
}

export const SpellsStep: React.FC<SpellsStepProps> = ({ className, spellcasting }) => {
    const { watch, setValue } = useFormContext<CharacterWizardValues>();
    const selected = watch("knownSpells") ?? [];
    // Same key and fetch as SpellInfo.tsx, so the cache is shared.
    const { data, isLoading } = useSWR<BaseDndResponse>(`/spells/${className}`, () => getSpellsForClass(className));

    // The fetch doesn't reject on HTTP errors, so guard against a non-list response.
    const results = data?.results;
    const allSpells = Array.isArray(results) ? (results as Spell[]) : [];
    const levels = castableSpellLevels(spellcasting);
    const groups = levels
        .map(level => ({ level, spells: allSpells.filter(s => s.level === level) }))
        .filter(g => g.spells.length > 0);

    const isSelected = (s: Spell) => selected.some(x => x.index === s.index);
    const toggle = (s: Spell) => {
        const next = isSelected(s) ? selected.filter(x => x.index !== s.index) : [...selected, s];
        setValue("knownSpells", next, { shouldDirty: true });
    };

    return (
        <Box mb={2}>
            {spellcasting && (
                <Flex gap="2" mb="3" wrap="wrap">
                    <Badge>{`Cantrips: ${spellcasting.cantrips_known}`}</Badge>
                    {spellcasting.spells_known > 0 && <Badge>{`Spells: ${spellcasting.spells_known}`}</Badge>}
                </Flex>
            )}
            <LoadingWrapper isLoading={isLoading}>
                {groups.length === 0 ? (
                    <Text fontSize="sm" color="fg.muted">No spells available for this class at this level.</Text>
                ) : (
                    groups.map(g => (
                        <Box key={g.level} mb="3">
                            <Text textStyle="label" color="fg.muted" mb="2">
                                {g.level === 0 ? "Cantrips" : `Level ${g.level} Spells`}
                            </Text>
                            <Flex wrap="wrap" gap="2">
                                {g.spells.map(s => {
                                    const on = isSelected(s);
                                    return (
                                        <chakra.button
                                            key={s.index}
                                            type="button"
                                            aria-pressed={on}
                                            onClick={() => toggle(s)}
                                            px="3"
                                            py="1"
                                            fontSize="xs"
                                            borderRadius="full"
                                            border="1px solid"
                                            borderColor={on ? "brand" : "border.strong"}
                                            bg="bg.raised"
                                            color="fg"
                                            outline={on ? "2px solid" : undefined}
                                            outlineColor={on ? "accent" : undefined}
                                            outlineOffset="1px"
                                            cursor="pointer"
                                            transition="all 200ms"
                                            _hover={{ borderColor: "accent" }}
                                        >
                                            {s.name}
                                        </chakra.button>
                                    );
                                })}
                            </Flex>
                        </Box>
                    ))
                )}
            </LoadingWrapper>
        </Box>
    );
};
