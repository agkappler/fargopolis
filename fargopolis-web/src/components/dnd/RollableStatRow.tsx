import { rollD20, rollMessage } from "@/helpers/Dice";
import { formatModifier } from "@/helpers/DndMath";
import { rollToast } from "@/helpers/Toasts";
import { Flex, Text } from "@chakra-ui/react";
import { rowProps } from "./statRowStyle";

/** A StatRow that rolls 1d20 + modifier and toasts the result on click. */
export const RollableStatRow: React.FC<{ label: string; modifier: number; displayValue?: React.ReactNode }> = ({ label, modifier, displayValue }) => {
    const handleRoll = () => {
        const { roll, total } = rollD20(modifier);
        rollToast(rollMessage(label, modifier, roll, total));
    };

    return (
        <Flex
            as="button"
            onClick={handleRoll}
            {...rowProps}
            w="full"
            bg="transparent"
            border="none"
            cursor="pointer"
            _hover={{ bg: "bg.sunk" }}
        >
            <Text textStyle="label">{label}</Text>
            <Text fontFamily="mono">{displayValue ?? formatModifier(modifier)}</Text>
        </Flex>
    );
};
