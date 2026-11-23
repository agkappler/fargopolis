import { Box, Button, CloseButton, Flex, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { RollEntry } from "./rollContext";

interface RollToastProps {
    entry?: RollEntry;
    onOpenLog: () => void;
}

const HIDE_AFTER_MS = 4000;

export const NatChip: React.FC<{ natural?: 20 | 1 }> = ({ natural }) => natural ? (
    <Text
        as="span"
        textStyle="label"
        borderRadius="full"
        px="2"
        py="0.5"
        whiteSpace="nowrap"
        bg={natural === 20 ? "pine.100" : "garnet.100"}
        color={natural === 20 ? "pine.700" : "garnet.700"}
    >
        Nat {natural}
    </Text>
) : null;

/** Bottom-left toast for the latest roll on the Play page. Hides 4s after each new roll. */
export const RollToast: React.FC<RollToastProps> = ({ entry, onOpenLog }) => {
    const [dismissedId, setDismissedId] = useState<string>();

    useEffect(() => {
        if (!entry) return;
        const timer = setTimeout(() => setDismissedId(entry.id), HIDE_AFTER_MS);
        return () => clearTimeout(timer);
    }, [entry]);

    if (!entry || dismissedId === entry.id) return null;

    const accent = entry.natural === 20 ? "pine.500" : entry.natural === 1 ? "garnet.500" : "ember.500";

    return (
        <Box
            position="fixed"
            left="4"
            bottom="4"
            zIndex="toast"
            maxW="calc(100vw - 32px)"
            w="340px"
            role="status"
            aria-live="polite"
            bg="bg.raised"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="border"
            borderLeftWidth="4px"
            borderLeftColor={accent}
            borderRadius="md"
            boxShadow="lg"
            p="3"
        >
            <Flex align="center" gap="3">
                {entry.total !== undefined && (
                    <Text
                        fontFamily="mono"
                        fontSize="2xl"
                        lineHeight="1"
                        minW="2ch"
                        textAlign="center"
                        color={entry.natural === 20 ? "pine.700" : entry.natural === 1 ? "garnet.700" : "fg"}
                    >
                        {entry.total}
                    </Text>
                )}
                <Box flex="1" minW="0">
                    <Flex align="center" gap="2" minW="0">
                        <Text fontWeight="600" fontSize="xs" truncate title={entry.label}>{entry.label}</Text>
                        <NatChip natural={entry.natural} />
                    </Flex>
                    {entry.math && <Text fontFamily="mono" fontSize="2xs" color="fg.muted" truncate>{entry.math}</Text>}
                    {entry.note && <Text fontSize="2xs" color="fg.muted">{entry.note}</Text>}
                </Box>
                <Button size="xs" variant="ghost" onClick={onOpenLog}>Log</Button>
                <CloseButton size="2xs" aria-label="Dismiss roll" onClick={() => setDismissedId(entry.id)} />
            </Flex>
        </Box>
    );
};
