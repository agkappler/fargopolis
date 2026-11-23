import { formatModifier } from "@/helpers/DndMath";
import { Flex, Text } from "@chakra-ui/react";
import { RollCell } from "./RollCell";
import { rowProps } from "./statRowStyle";

interface RollableStatRowProps {
    label: string;
    modifier: number;
    /** Defaults to "Roll <label>, <modifier>". */
    ariaLabel?: string;
}

/** A stat row whose value is a roll pill (rolls 1d20 + modifier and toasts the result). */
export const RollableStatRow: React.FC<RollableStatRowProps> = ({ label, modifier, ariaLabel }) => (
    <Flex {...rowProps}>
        <Text textStyle="label">{label}</Text>
        <RollCell
            label={label}
            modifier={modifier}
            ariaLabel={ariaLabel ?? `Roll ${label.toLowerCase()}, ${formatModifier(modifier)}`}
        />
    </Flex>
);
