import Ability from "@/models/Ability";
import { Box, Chip, Typography } from "@mui/material";
import { getLabelForAbilitySource, getLabelForUsageType } from "@/constants/Abilities";
import { SimpleDialog } from "../../ui/SimpleDialog";

interface AbilityDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    ability: Ability;
}

export const AbilityDetailsModal: React.FC<AbilityDetailsModalProps> = ({
    isOpen,
    onClose,
    ability,
}) => {
    return (
        <SimpleDialog title={ability.name} isOpen={isOpen} onClose={onClose}>
            <Box>
                <Box display="flex" flexWrap="wrap" gap={1} mb={2} justifyContent="center">
                    <Chip
                        label={`${getLabelForAbilitySource(ability.source)}: ${ability.sourceDescription}`}
                    />
                    <Chip
                        label={`Usage: ${getLabelForUsageType(ability.usage)}`}
                    />
                    <Chip
                        label={`Recovery: ${ability.recovery}`}
                    />
                </Box>
                <Typography variant="body1">
                    {ability.description}
                </Typography>
            </Box>
        </SimpleDialog>
    );
};
