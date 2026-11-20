import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Quest from "@/models/Quest";
import { useAuth } from "@clerk/react";
import { Text } from "@chakra-ui/react";
import { type FC, useState } from "react";
import { ModelCard } from "../ui/ModelCard";
import { ErrorMessage } from "../ui/ErrorMessage";

interface QuestCardProps {
    quest: Quest;
    /** Called after a tap successfully records a completion (lets the page re-fetch balance/history). */
    onComplete: () => void;
    onEdit?: () => void;
}

export const QuestCard: FC<QuestCardProps> = ({ quest, onComplete, onEdit }) => {
    const { getToken } = useAuth();
    const [isCompleting, setIsCompleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>();

    const handleComplete = async () => {
        if (!quest.active) {
            return;
        }
        setErrorMessage(undefined);
        setIsCompleting(true);
        try {
            await RequestManager.post("/completeQuest", { questId: quest.questId }, getToken);
            onComplete();
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <ModelCard
            gap="2.5"
            onClick={quest.active ? handleComplete : undefined}
            opacity={isCompleting ? 0.6 : quest.active ? 1 : 0.6}
        >
            <Text
                as="h3"
                m="0"
                textStyle="display-title"
                fontSize="md"
                color="fg"
                style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
            >
                {quest.name}
            </Text>
            {quest.description && (
                <Text fontSize="xs" color="fg.secondary" lineHeight="1.45" flex="1">
                    {quest.description}
                </Text>
            )}
            <Text textStyle="label" color="brand">
                +{quest.pointValue} pts
            </Text>
            {!quest.active && (
                <Text textStyle="label" color="fg.muted">
                    Archived
                </Text>
            )}
            <ErrorMessage errorMessage={errorMessage} />
            {onEdit && (
                <Text
                    fontSize="xs"
                    color="fg.muted"
                    textDecoration="underline"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                >
                    Edit
                </Text>
            )}
        </ModelCard>
    );
};
