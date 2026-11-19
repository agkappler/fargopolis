import { QuestCard } from "@/components/quests/QuestCard";
import { QuestForm } from "@/components/quests/QuestForm";
import { QuestHistoryList } from "@/components/quests/QuestHistoryList";
import { RewardCard } from "@/components/quests/RewardCard";
import { RewardForm } from "@/components/quests/RewardForm";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { ErrorWrapper } from "@/components/ui/ErrorWrapper";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import RequestManager from "@/helpers/RequestManager";
import Quest from "@/models/Quest";
import QuestLedgerEntry from "@/models/QuestLedgerEntry";
import QuestReward from "@/models/QuestReward";
import { useAuth } from "@clerk/react";
import { Box, Grid, Text } from "@chakra-ui/react";
import { useState } from "react";
import useSWR from "swr";

export function QuestsPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [isQuestFormOpen, setIsQuestFormOpen] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState<Quest>();
    const [isRewardFormOpen, setIsRewardFormOpen] = useState(false);
    const [selectedReward, setSelectedReward] = useState<QuestReward>();

    const canFetch = isLoaded && isSignedIn;

    const {
        data: quests,
        error: questsError,
        isLoading: isLoadingQuests,
        mutate: mutateQuests,
    } = useSWR(canFetch ? "/quests" : null, () => RequestManager.get<Quest[]>("/quests", getToken));

    const {
        data: balance,
        error: balanceError,
        isLoading: isLoadingBalance,
        mutate: mutateBalance,
    } = useSWR(
        canFetch ? "/questBalance" : null,
        () => RequestManager.get<{ total: number }>("/questBalance", getToken),
    );

    const {
        data: rewards,
        error: rewardsError,
        isLoading: isLoadingRewards,
        mutate: mutateRewards,
    } = useSWR(
        canFetch ? "/questRewards" : null,
        () => RequestManager.get<QuestReward[]>("/questRewards", getToken),
    );

    const {
        data: history,
        error: historyError,
        isLoading: isLoadingHistory,
        mutate: mutateHistory,
    } = useSWR(
        canFetch ? "/questHistory" : null,
        () => RequestManager.get<QuestLedgerEntry[]>("/questHistory", getToken),
    );

    const refreshAfterPointsActivity = () => {
        mutateBalance();
        mutateHistory();
    };

    const onQuestFormClose = () => {
        setIsQuestFormOpen(false);
        setSelectedQuest(undefined);
    };

    const onRewardFormClose = () => {
        setIsRewardFormOpen(false);
        setSelectedReward(undefined);
    };

    return (
        <>
            <PageHeader title="Quests" />

            <LoadingWrapper isLoading={isLoadingBalance}>
                <ErrorWrapper error={balanceError} errorMessage="Failed to load point balance.">
                    <Box textAlign="center" py="4">
                        <Text textStyle="label" color="fg.muted">
                            Point Balance
                        </Text>
                        <Text textStyle="display-title" fontSize="3xl" color="fg">
                            {balance?.total ?? 0}
                        </Text>
                    </Box>
                </ErrorWrapper>
            </LoadingWrapper>

            <LoadingWrapper isLoading={isLoadingQuests}>
                <ErrorWrapper error={questsError} errorMessage="Failed to load quests.">
                    <Grid
                        templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }}
                        gap="4"
                        px="4"
                        py="6"
                        maxW="fp.container"
                        mx="auto"
                    >
                        <AddModelCard onClick={() => setIsQuestFormOpen(true)} title="Add Quest" />
                        {quests?.map((quest) => (
                            <QuestCard
                                key={quest.questId}
                                quest={quest}
                                onComplete={refreshAfterPointsActivity}
                                onEdit={() => {
                                    setSelectedQuest(quest);
                                    setIsQuestFormOpen(true);
                                }}
                            />
                        ))}
                    </Grid>
                </ErrorWrapper>
            </LoadingWrapper>

            <LoadingWrapper isLoading={isLoadingRewards}>
                <ErrorWrapper error={rewardsError} errorMessage="Failed to load rewards.">
                    <Grid
                        templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }}
                        gap="4"
                        px="4"
                        py="6"
                        maxW="fp.container"
                        mx="auto"
                    >
                        <AddModelCard onClick={() => setIsRewardFormOpen(true)} title="Add Reward" />
                        {rewards?.map((reward) => (
                            <RewardCard
                                key={reward.rewardId}
                                reward={reward}
                                balance={balance?.total ?? 0}
                                onRedeem={refreshAfterPointsActivity}
                                onEdit={() => {
                                    setSelectedReward(reward);
                                    setIsRewardFormOpen(true);
                                }}
                            />
                        ))}
                    </Grid>
                </ErrorWrapper>
            </LoadingWrapper>

            <Box maxW="fp.container" mx="auto" px="4" pb="8">
                <Text textStyle="label" color="fg.muted" mb="2">
                    History
                </Text>
                <LoadingWrapper isLoading={isLoadingHistory}>
                    <ErrorWrapper error={historyError} errorMessage="Failed to load history.">
                        <QuestHistoryList history={history ?? []} />
                    </ErrorWrapper>
                </LoadingWrapper>
            </Box>

            <QuestForm isOpen={isQuestFormOpen} onClose={onQuestFormClose} quest={selectedQuest} updateQuests={mutateQuests} />
            <RewardForm isOpen={isRewardFormOpen} onClose={onRewardFormClose} reward={selectedReward} updateRewards={mutateRewards} />
        </>
    );
}
