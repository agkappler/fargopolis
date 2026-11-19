import QuestLedgerEntry from "@/models/QuestLedgerEntry";
import { Box, Flex, Text } from "@chakra-ui/react";
import { type FC } from "react";

interface QuestHistoryListProps {
    history: QuestLedgerEntry[];
}

const describeEntry = (entry: QuestLedgerEntry): string => {
    if (entry.type === "COMPLETION") {
        return "Completed a quest";
    }
    return "Redeemed a reward";
};

export const QuestHistoryList: FC<QuestHistoryListProps> = ({ history }) => {
    // Most-recent-first for display; the API returns the chronological (oldest-first) order
    // needed for the balance-matches-history invariant.
    const reversed = [...history].reverse();

    if (reversed.length === 0) {
        return (
            <Text color="fg.muted" textAlign="center" py="4">
                No activity yet.
            </Text>
        );
    }

    return (
        <Box>
            {reversed.map((entry) => (
                <Flex
                    key={entry.ledgerId}
                    justify="space-between"
                    align="center"
                    borderBottom="1px solid"
                    borderBottomColor="border"
                    py="2"
                >
                    <Box>
                        <Text fontSize="sm" color="fg">
                            {describeEntry(entry)}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                            {new Date(entry.occurredAt).toLocaleString()}
                        </Text>
                    </Box>
                    <Text
                        fontSize="sm"
                        fontWeight="600"
                        color={entry.pointsDelta >= 0 ? "pine.500" : "ember.500"}
                    >
                        {entry.pointsDelta >= 0 ? "+" : ""}
                        {entry.pointsDelta}
                    </Text>
                </Flex>
            ))}
        </Box>
    );
};
