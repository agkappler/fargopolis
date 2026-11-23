import type { Condition } from "@/constants/Conditions";
import { CloseButton, Flex, Text } from "@chakra-ui/react";
import { StatBox } from "../StatBox";

interface StatusCardProps {
    concentratingOn?: string;
    conditions: Condition[];
    onEndConcentration: () => void;
    onRemoveCondition: (c: Condition) => void;
}

const Chip: React.FC<{ label: string; tone: "ember" | "slate"; removeLabel: string; onRemove: () => void }> = ({
    label, tone, removeLabel, onRemove,
}) => (
    <Flex
        align="center"
        gap="1"
        pl="2"
        pr="0.5"
        py="0.5"
        borderRadius="full"
        borderWidth="1px"
        borderStyle="solid"
        bg={tone === "ember" ? "ember.100" : "bg.raised"}
        borderColor={tone === "ember" ? "ember.500" : "slate.300"}
        color={tone === "ember" ? "ember.900" : "slate.700"}
        minW="0"
    >
        <Text as="span" fontSize="2xs" fontWeight="600" truncate>{label}</Text>
        <CloseButton size="2xs" aria-label={removeLabel} onClick={onRemove} />
    </Flex>
);

/**
 * Concentration + active conditions. Session-only page state (lost on reload); persistence is
 * issue #43. Renders nothing when neither is active.
 */
export const StatusCard: React.FC<StatusCardProps> = ({ concentratingOn, conditions, onEndConcentration, onRemoveCondition }) => {
    if (!concentratingOn && conditions.length === 0) return null;
    return (
        <StatBox title="Status">
            <Flex gap="1.5" flexWrap="wrap">
                {concentratingOn && (
                    <Chip
                        tone="ember"
                        label={`Concentrating · ${concentratingOn}`}
                        removeLabel="End concentration"
                        onRemove={onEndConcentration}
                    />
                )}
                {conditions.map(c => (
                    <Chip key={c} tone="slate" label={c} removeLabel={`Remove ${c}`} onRemove={() => onRemoveCondition(c)} />
                ))}
            </Flex>
        </StatBox>
    );
};
