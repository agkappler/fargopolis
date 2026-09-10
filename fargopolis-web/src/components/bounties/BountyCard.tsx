import { BountyStatus, getColorForBountyStatus, getLabelForBountyStatus } from "@/constants/Status";
import Bounty from "@/models/Bounty";
import BountyCategory from "@/models/BountyCategory";
import { Text } from "@chakra-ui/react";
import { ModelCard } from "../ui/ModelCard";
import { StatusChip } from "../ui/StatusChip";

interface BountyCardProps {
    bounty: Bounty;
    onClick: () => void;
    category: BountyCategory | undefined;
}

export const BountyCard: React.FC<BountyCardProps> = ({ bounty, onClick, category }) => {
    return (
        <ModelCard gap="2.5" onClick={onClick}>
            <StatusChip
                label={getLabelForBountyStatus(bounty.status)}
                color={getColorForBountyStatus(bounty.status)}
            />
            <Text
                as="h3"
                m="0"
                textStyle="display-title"
                fontSize="md"
                color="fg"
                style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
                textDecoration={bounty.status === BountyStatus.Complete ? "line-through" : "none"}
                textDecorationColor="pine.500"
            >
                {bounty.title}
            </Text>
            {bounty.description && (
                <Text fontSize="xs" color="fg.secondary" lineHeight="1.45" flex="1">
                    {bounty.description}
                </Text>
            )}
            {category && (
                <Text textStyle="label" color="fg.muted">
                    {category.name}
                </Text>
            )}
        </ModelCard>
    );
}
