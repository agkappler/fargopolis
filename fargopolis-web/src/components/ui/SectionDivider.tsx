import { Box, Flex } from "@chakra-ui/react";

interface SectionDividerProps {
    label: string;
    mt?: string;
    mb?: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({ label, mt, mb = "4" }) => (
    <Flex align="center" gap="3" mt={mt} mb={mb}>
        <Box textStyle="label" color="fg.muted" flexShrink="0">{label}</Box>
        <Box flex="1" h="1px" bg="border.DEFAULT" />
        <Box w="8px" h="8px" borderRadius="full" bg="ember.500" flexShrink="0" />
    </Flex>
);
