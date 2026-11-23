import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { Box, Flex, Text } from "@chakra-ui/react";
import { PropsWithChildren, ReactNode } from "react";

interface StatBoxProps extends PropsWithChildren {
    title: string;
    /** Optional content on the right of the card header (e.g. a "+3 temp" pill). */
    headerRight?: ReactNode;
}

/** A stat card: a flex column that fills its grid cell, so sibling cards stretch to equal height. */
export const StatBox: React.FC<StatBoxProps> = ({ title, headerRight, children }) => (
    <Box {...surfaceBorderProps} p="3" display="flex" flexDir="column" h="full">
        <Flex justify="space-between" align="center" gap="2" mb="2" minH="6">
            <Text textStyle="label" color="fg.muted">{title}</Text>
            {headerRight}
        </Flex>
        {children}
    </Box>
);
