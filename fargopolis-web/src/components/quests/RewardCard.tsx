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
    const canRedeem = canAfford && reward.active;

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
        <ModelCard gap={{ base: "1", md: "1.5" }} p={{ base: "2", md: "3" }} opacity={reward.active ? 1 : 0.6}>
            <Text
                as="h3"
                m="0"
                textStyle="display-title"
                fontSize={{ base: "xs", md: "sm" }}
                color="fg"
                style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
            >
                {reward.name}
            </Text>
            <Text textStyle="label" color="fg.muted">
                {reward.pointCost} pts
            </Text>
            {!reward.active && (
                <Text textStyle="label" color="fg.muted">
                    Archived
                </Text>
            )}
            <Button
                variant="primary"
                w="full"
                px={{ base: "2", md: "4" }}
                py={{ base: "1", md: "2" }}
                fontSize={{ base: "xs", md: "sm" }}
                disabled={!canRedeem}
                loading={isRedeeming}
                onClick={handleRedeem}
            >
                Redeem
            </Button>
            <ErrorMessage errorMessage={errorMessage} />
            {onEdit && (
                <Text fontSize={{ base: "2xs", md: "xs" }} color="fg.muted" textDecoration="underline" onClick={onEdit}>
                    Edit
                </Text>
            )}
        </ModelCard>
    );
};
