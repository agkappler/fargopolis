import { Button, Flex, Text } from "@chakra-ui/react";

interface StatEmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

/** Dashed empty box that fills a stat card when its stats haven't been set yet. */
export const StatEmptyState: React.FC<StatEmptyStateProps> = ({ title, description, actionLabel, onAction }) => (
    <Flex
        flex="1"
        direction="column"
        align="center"
        justify="center"
        textAlign="center"
        gap="2"
        p="4"
        borderWidth="1.5px"
        borderStyle="dashed"
        borderColor="border.strong"
        borderRadius="md"
        bg="bg.sunk"
    >
        <Text fontWeight="600" fontSize="xs">{title}</Text>
        <Text fontSize="xs" color="fg.muted">{description}</Text>
        {actionLabel && onAction && (
            <Button variant="outline" size="sm" minH="10" mt="1" onClick={onAction}>
                {actionLabel}
            </Button>
        )}
    </Flex>
);
