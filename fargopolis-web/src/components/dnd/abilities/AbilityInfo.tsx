import { AbilitySource } from "@/constants/Abilities";
import RequestManager from "@/helpers/RequestManager";
import Ability from "@/models/Ability";
import { Box, Grid, GridItem, Text } from "@chakra-ui/react";
import { useState } from "react";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { AddModelCard } from "../../ui/AddModelCard";
import { AbilityForm } from "./AbilityForm";
import { AbilityCard } from "./AbilityCard";

interface AbilityInfoProps {
    characterId: string;
    canEdit?: boolean;
}

export const AbilityInfo: React.FC<AbilityInfoProps> = ({ characterId, canEdit = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAbility, setSelectedAbility] = useState<Ability>();

    const { data: abilities, isLoading, mutate } = useSWR<Ability[]>(
        `/characterAbilities/${characterId}`,
        () => RequestManager.get<Ability[]>(`/characterAbilities/${characterId}`),
    );

    const sortAbilitiesByType = (abilities: Ability[]) => {
        const sourceOrder = [AbilitySource.Class, AbilitySource.Race, AbilitySource.Feat, AbilitySource.Other];

        return abilities.sort((a, b) => {
            const aIndex = sourceOrder.indexOf(a.source);
            const bIndex = sourceOrder.indexOf(b.source);

            if (aIndex !== bIndex) {
                return aIndex - bIndex;
            }

            // If same source type, sort by name
            return a.name.localeCompare(b.name);
        });
    };

    const onClose = () => {
        setIsOpen(false);
        setSelectedAbility(undefined);
    }

    const onEditAbility = (ability: Ability) => {
        setSelectedAbility(ability);
        setIsOpen(true);
    }

    const sortedAbilities = abilities ? sortAbilitiesByType(abilities) : [];

    return (
        <Box>
            <LoadingWrapper isLoading={isLoading}>
                <Grid templateColumns="repeat(12, 1fr)" gap={4}>
                    {canEdit && (
                        <GridItem colSpan={{ base: 12, sm: 6, md: 4 }}>
                            <AddModelCard onClick={() => setIsOpen(true)} title="Add Ability" />
                        </GridItem>
                    )}
                    {sortedAbilities.map((ability) => (
                        <GridItem key={ability.abilityId} colSpan={{ base: 12, sm: 6, md: 4 }}>
                            <AbilityCard
                                ability={ability}
                                characterId={characterId}
                                canEdit={canEdit}
                                onAbilityUpdate={mutate}
                                onClick={canEdit ? onEditAbility : undefined}
                            />
                        </GridItem>
                    ))}
                    {(!sortedAbilities || sortedAbilities.length === 0) && !isLoading && (
                        <GridItem colSpan={12}>
                            <Text>No abilities found for this character.</Text>
                        </GridItem>
                    )}
                </Grid>
            </LoadingWrapper>
            <AbilityForm
                isOpen={isOpen}
                onClose={onClose}
                characterId={characterId}
                ability={selectedAbility}
                onAbilityUpdate={mutate}
            />
        </Box>
    );
};
