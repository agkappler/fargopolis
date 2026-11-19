import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import QuestReward from "@/models/QuestReward";
import { useAuth } from "@clerk/react";
import { Button, Text } from "@chakra-ui/react";
import { type FC, useState } from "react";
import { ErrorMessage } from "../ui/ErrorMessage";
import { ModelCard } from "../ui/ModelCard";

interface RewardCardProps {
    reward: QuestReward;
    balance: number;
    /** Called after a successful redemption (lets the page re-fetch balance/history). */
    onRedeem: () => void;
    onEdit?: () => void;
}

export const RewardCard: FC<RewardCardProps> = ({ reward, balance, onRedeem, onEdit }) => {
    const { getToken } = useAuth();
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>();
    const canAfford = balance >= reward.pointCost;

    const handleRedeem = async () => {
        setErrorMessage(undefined);
        setIsRedeeming(true);
        try {
            await RequestManager.post("/redeemQuestReward", { rewardId: reward.rewardId }, getToken);
            onRedeem();
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <ModelCard gap="2.5">
            <Text
                as="h3"
                m="0"
                textStyle="display-title"
                fontSize="md"
                color="fg"
                style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
            >
                {reward.name}
            </Text>
            {reward.description && (
                <Text fontSize="xs" color="fg.secondary" lineHeight="1.45" flex="1">
                    {reward.description}
                </Text>
            )}
            <Text textStyle="label" color="fg.muted">
                {reward.pointCost} pts
            </Text>
            <Button
                variant="primary"
                size="sm"
                disabled={!canAfford}
                loading={isRedeeming}
                onClick={handleRedeem}
            >
                Redeem
            </Button>
            <ErrorMessage errorMessage={errorMessage} />
            {onEdit && (
                <Text fontSize="xs" color="fg.muted" textDecoration="underline" onClick={onEdit}>
                    Edit
                </Text>
            )}
        </ModelCard>
    );
};
