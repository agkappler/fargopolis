import { getColorForAbilitySource, getLabelForAbilitySource, getLabelForUsageType, getColorForUsageType } from "@/constants/Abilities";
import Ability from "@/models/Ability";
import { Box, Chip } from "@mui/material";
import { useState } from "react";
import { ModelCard } from "../../ui/ModelCard";
import { AbilityDetailsModal } from "./AbilityDetailsModal";
import { AbilityForm } from "./AbilityForm";

interface AbilityCardProps {
    ability: Ability;
    characterId?: string;
    canEdit?: boolean;
    onAbilityUpdate?: () => void;
    onClick?: (ability: Ability) => void;
}

export const AbilityCard: React.FC<AbilityCardProps> = ({
    ability,
    characterId,
    canEdit = false,
    onAbilityUpdate,
    onClick
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleClick = () => {
        if (onClick) {
            onClick(ability);
        } else if (canEdit) {
            setIsEditModalOpen(true);
        } else {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <ModelCard
                title={ability.name}
                onClick={handleClick}
            >
                <Box display="flex" flexWrap="wrap" gap={1} mb={2} justifyContent="center">
                    <Chip
                        label={`${getLabelForAbilitySource(ability.source)}: ${ability.sourceDescription}`}
                        color={getColorForAbilitySource(ability.source)}
                        size="small"
                    />
                    <Chip
                        label={`${getLabelForUsageType(ability.usage)}`}
                        color={getColorForUsageType(ability.usage)}
                        size="small"
                    />
                    <Chip
                        label={`Recovery: ${ability.recovery}`}
                        size="small"
                    />
                </Box>
            </ModelCard>

            <AbilityDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                ability={ability}
            />
            <AbilityForm
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                characterId={characterId}
                ability={ability}
                onAbilityUpdate={onAbilityUpdate}
            />
        </>
    );
};
