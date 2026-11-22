import { Flex, Text } from "@chakra-ui/react";
import { rowProps } from "./statRowStyle";

export const StatRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Flex {...rowProps}>
        <Text textStyle="label">{label}</Text>
        <Text fontFamily="mono">{value}</Text>
    </Flex>
);
