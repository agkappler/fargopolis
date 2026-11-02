import { Box, Flex, Heading } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { surfaceCardProps } from "../ui/surfaceStyle";

interface ProjectSectionProps {
    icon: LucideIcon;
    title: string;
    headerExtra?: ReactNode;
    isPlaceholder?: boolean;
    children: ReactNode;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({
    icon: Icon,
    title,
    headerExtra,
    isPlaceholder,
    children,
}) => {
    return (
        <Box
            as="section"
            {...surfaceCardProps}
            p="5"
            h="full"
            borderTopWidth="2px"
            borderTopColor="accent"
        >
            <Flex align="center" gap="3" mb="3">
                <Flex
                    align="center"
                    justify="center"
                    w="32px"
                    h="32px"
                    flexShrink="0"
                    borderRadius="full"
                    bg="bg.sunk"
                    color="accent"
                    aria-hidden="true"
                >
                    <Icon size={16} />
                </Flex>
                <Heading size="md">{title}</Heading>
                {headerExtra && <Box ml="auto">{headerExtra}</Box>}
            </Flex>
            <Box
                color={isPlaceholder ? "fg.muted" : "fg"}
                fontStyle={isPlaceholder ? "italic" : undefined}
            >
                {children}
            </Box>
        </Box>
    );
};
