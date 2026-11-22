import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { rollD20 } from "@/helpers/Dice";
import { formatModifier } from "@/helpers/DndMath";
import { rollToast } from "@/helpers/Toasts";
import { Box, Flex, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export const rowProps = {
    justify: "space-between",
    align: "center",
    py: "1.5",
    borderBottomWidth: "1px",
    borderColor: "border.soft",
    _last: { borderBottomWidth: 0 },
} as const;

export const StatBox: React.FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
    <Box
        {...surfaceBorderProps}
        p="3"
    >
        <Text textStyle="label" color="fg.muted" mb="2">{title}</Text>
        {children}
    </Box>
);

export const StatRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Flex {...rowProps}>
        <Text textStyle="label">{label}</Text>
        <Text fontFamily="mono">{value}</Text>
    </Flex>
);

export const rollMessage = (label: string, modifier: number, roll: number, total: number) =>
    `${label}: d20${formatModifier(modifier)} → ${total} (rolled ${roll})`;

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
