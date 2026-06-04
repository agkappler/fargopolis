import { Badge, Box } from "@chakra-ui/react";

export type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

type ChipStatus = "success" | "info" | "warning" | "error";

const colorToStatus: Record<ChipColor, ChipStatus> = {
    success:   "success",
    warning:   "warning",
    error:     "error",
    info:      "info",
    primary:   "info",
    secondary: "info",
    default:   "info",
};

const dotColor: Record<ChipStatus, string> = {
    success: "#4a6e54",
    info:    "#4a5d6a",
    warning: "#c79234",
    error:   "#b03a2e",
};

interface StatusChipProps {
    label: string;
    color: ChipColor;
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, color }) => {
    const status = colorToStatus[color] ?? "info";
    return (
        <Badge {...{ status } as object}>
            <Box
                as="span"
                display="inline-block"
                w="6px"
                h="6px"
                borderRadius="full"
                bg={dotColor[status]}
                flexShrink="0"
            />
            {label}
        </Badge>
    );
};
