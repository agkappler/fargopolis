import { DndItem, getRelativeUrlInfo } from "@/api/dnd5eapi";
import { AbilitySource } from "@/constants/Abilities";
import { Plus } from "lucide-react";
import { Button, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { AbilityForm } from "../abilities/AbilityForm";
import { FeatureRow, RacePill } from "../FeatureRow";
import { OptionsList } from "../OptionsList";
import { DraconicAncestryTable } from "./DraconicAncestryTable";

interface RacialTraitCardProps {
    trait: DndItem;
    characterId?: string;
    raceName?: string;
}

export const RacialTraitCard: React.FC<RacialTraitCardProps> = ({ trait, characterId, raceName }) => {
    const { data: traitInfo, isLoading } = useSWR(trait.index, () => getRelativeUrlInfo(trait.url));
    const [isAbilityFormOpen, setIsAbilityFormOpen] = useState(false);

    const getTraitDescription = () => {
        if (!traitInfo?.desc) return "";
        return traitInfo.desc.join(" ");
    };

    return (
        <>
            <FeatureRow
                pill={<RacePill />}
                name={trait.name}
                action={characterId && traitInfo && (
                    <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Create ability from ${trait.name}`}
                        onClick={() => setIsAbilityFormOpen(true)}
                    >
                        <Plus size={14} />
                        Ability
                    </Button>
                )}
            >
                <LoadingWrapper isLoading={isLoading} size={20}>
                    {traitInfo && <>
                        {traitInfo.desc.map((d: string, index: number) => (
                            <Text key={index} textAlign="left">{d}</Text>
                        ))}
                        {traitInfo.trait_specific && (
                            traitInfo.index === 'draconic-ancestry'
                                ? <DraconicAncestryTable subOptions={traitInfo.trait_specific.subtrait_options} />
                                : <OptionsList subOptions={traitInfo.trait_specific.subtrait_options ?? traitInfo.trait_specific.spell_options} />
                        )}
                    </>}
                </LoadingWrapper>
            </FeatureRow>
            {characterId && (
                <AbilityForm
                    isOpen={isAbilityFormOpen}
                    onClose={() => setIsAbilityFormOpen(false)}
                    characterId={characterId}
                    defaultSource={AbilitySource.Race}
                    defaultSourceDescription={raceName || "Race"}
                    defaultName={trait.name}
                    defaultDescription={getTraitDescription()}
                />
            )}
        </>
    );
}
