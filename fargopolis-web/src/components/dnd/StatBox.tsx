import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { Box, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export const StatBox: React.FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
    <Box
        {...surfaceBorderProps}
        p="3"
    >
        <Text textStyle="label" color="fg.muted" mb="2">{title}</Text>
        {children}
    </Box>
);
