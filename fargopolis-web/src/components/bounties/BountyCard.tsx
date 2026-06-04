import { BountyStatus, getColorForBountyStatus, getLabelForBountyStatus } from "@/constants/Status";
import Bounty from "@/models/Bounty";
import BountyCategory from "@/models/BountyCategory";
import { Box, Text } from "@chakra-ui/react";
import { StatusChip } from "../ui/StatusChip";

interface BountyCardProps {
    bounty: Bounty;
    onClick: () => void;
    category: BountyCategory | undefined;
}

export const BountyCard: React.FC<BountyCardProps> = ({ bounty, onClick, category }) => {
    return (
        <Box
            bg="bg.raised"
            border="1px solid"
            borderColor="border.DEFAULT"
            borderRadius="md"
            p="4"
            display="flex"
            flexDir="column"
            gap="2.5"
            boxShadow="sm"
            cursor="pointer"
            transition="all 200ms"
            _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
            onClick={onClick}
        >
            <StatusChip
                label={getLabelForBountyStatus(bounty.status)}
                color={getColorForBountyStatus(bounty.status)}
            />
            <Text
                as="h3"
                m="0"
                textStyle="display-title"
                fontSize="md"
                color="fg.DEFAULT"
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
        </Box>
    );
}