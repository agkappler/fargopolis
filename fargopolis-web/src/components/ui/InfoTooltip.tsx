import { chakra, Portal, Tooltip } from "@chakra-ui/react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
    /** Short guidance shown on hover, e.g. how to derive a freeform field's value. */
    label: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ label }) => (
    <Tooltip.Root openDelay={150} positioning={{ placement: "top" }}>
        <Tooltip.Trigger asChild>
            <chakra.span
                display="inline-flex"
                alignItems="center"
                color="fg.muted"
                cursor="help"
                ml="1"
                _hover={{ color: "accent" }}
            >
                <Info size={13} />
            </chakra.span>
        </Tooltip.Trigger>
        <Portal>
            <Tooltip.Positioner>
                <Tooltip.Content maxW="52" fontSize="xs">
                    {label}
                </Tooltip.Content>
            </Tooltip.Positioner>
        </Portal>
    </Tooltip.Root>
);
