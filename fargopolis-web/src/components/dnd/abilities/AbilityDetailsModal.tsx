import Ability from "@/models/Ability";
import { Badge, Box, Text } from "@chakra-ui/react";
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
                    <Badge>{`${getLabelForAbilitySource(ability.source)}: ${ability.sourceDescription}`}</Badge>
                    <Badge>{`Usage: ${getLabelForUsageType(ability.usage)}`}</Badge>
                    <Badge>{`Recovery: ${ability.recovery}`}</Badge>
                </Box>
                <Text>
                    {ability.description}
                </Text>
            </Box>
        </SimpleDialog>
    );
};
