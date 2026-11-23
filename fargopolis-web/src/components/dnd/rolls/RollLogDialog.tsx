import { SimpleDialog } from "@/components/ui/SimpleDialog";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { RollEntry } from "./rollContext";
import { NatChip } from "./RollToast";

interface RollLogDialogProps {
    isOpen: boolean;
    entries: RollEntry[];
    onClose: () => void;
    onClear: () => void;
}

const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** The session roll log (newest first). In memory only — persisting it is issue #44. */
export const RollLogDialog: React.FC<RollLogDialogProps> = ({ isOpen, entries, onClose, onClear }) => (
    <SimpleDialog title="Roll log" isOpen={isOpen} onClose={onClose}>
        {entries.length === 0 ? (
            <Text fontSize="xs" color="fg.muted" textAlign="center" py="4">No rolls yet</Text>
        ) : (
            <Box as="ol" listStyleType="none" m="0" p="0" maxH="60vh" overflowY="auto" aria-label="Recent rolls">
                {entries.map(e => (
                    <Flex
                        as="li"
                        key={e.id}
                        align="center"
                        gap="3"
                        py="2"
                        borderBottomWidth="1px"
                        borderColor="border.soft"
                        _last={{ borderBottomWidth: 0 }}
                    >
                        <Text fontFamily="mono" fontSize="2xs" color="fg.subtle" minW="7ch">{time(e.at)}</Text>
                        <Box flex="1" minW="0">
                            <Flex align="center" gap="2">
                                <Text fontSize="xs" fontWeight="600" truncate>{e.label}</Text>
                                <NatChip natural={e.natural} />
                            </Flex>
                            {(e.math || e.note) && (
                                <Text fontSize="2xs" color="fg.muted" fontFamily={e.math ? "mono" : undefined}>
                                    {e.math ?? e.note}
                                </Text>
                            )}
                        </Box>
                        {e.total !== undefined && (
                            <Text fontFamily="mono" fontSize="lg" lineHeight="1">{e.total}</Text>
                        )}
                    </Flex>
                ))}
            </Box>
        )}
        <Flex justify="flex-end" gap="2" mt="4" mb="2">
            <Button variant="secondary" size="sm" onClick={onClear} disabled={entries.length === 0}>Clear</Button>
            <Button variant="primary" size="sm" onClick={onClose}>Close</Button>
        </Flex>
    </SimpleDialog>
);
