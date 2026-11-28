import { QuestCard } from "@/components/quests/QuestCard";
import { QuestForm } from "@/components/quests/QuestForm";
import { QuestHistoryList } from "@/components/quests/QuestHistoryList";
import { RewardCard } from "@/components/quests/RewardCard";
import { RewardForm } from "@/components/quests/RewardForm";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { CardGrid } from "@/components/ui/CardGrid";
import { ErrorWrapper } from "@/components/ui/ErrorWrapper";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { MOBILE_BREAK } from "@/constants/Media";
import { readCachedQuests, writeCachedQuests } from "@/helpers/QuestCache";
import { sortQuestsByPointValue } from "@/helpers/QuestSort";
import RequestManager from "@/helpers/RequestManager";
import Quest from "@/models/Quest";
import QuestLedgerEntry from "@/models/QuestLedgerEntry";
import QuestReward from "@/models/QuestReward";
import { useAuth } from "@clerk/react";
import { Box, Switch, Tabs, Text, useMediaQuery } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import useSWR from "swr";

type QuestsSection = "quests" | "rewards" | "history";

export function QuestsPage() {
    const { getToken, isLoaded, isSignedIn, userId } = useAuth();
    const [isMobile] = useMediaQuery([`(max-width: ${MOBILE_BREAK})`], { fallback: [false] });

    const [isQuestFormOpen, setIsQuestFormOpen] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState<Quest>();
    const [isRewardFormOpen, setIsRewardFormOpen] = useState(false);
    const [selectedReward, setSelectedReward] = useState<QuestReward>();
    const [showArchived, setShowArchived] = useState(false);
    const [activeSection, setActiveSection] = useState<QuestsSection>("quests");

    const canFetch = isLoaded && isSignedIn;
    // Archived catalog items/rewards are otherwise invisible once hidden from the active list
    // (quest-catalog/quest-rewards specs) -- this toggle is the only way to find and un-archive one.
    const questsUrl = showArchived ? "/quests?includeInactive=true" : "/quests";
    const rewardsUrl = showArchived ? "/questRewards?includeInactive=true" : "/questRewards";

    // Quests are persisted per signed-in user + URL so a cold open can render the last-known list
    // while revalidating. Nothing is read or shown until Clerk has loaded and a user is signed in.
    const questsUserId = canFetch && userId ? userId : null;
    const persistedQuests = useMemo(
        () => (questsUserId ? readCachedQuests(questsUserId, questsUrl) : undefined),
        [questsUserId, questsUrl],
    );

    // userId is part of the SWR key so SWR's in-memory cache is per user, too.
    const questsKey: [string, string] | null = questsUserId ? [questsUrl, questsUserId] : null;
    const {
        data: swrQuests,
        error: questsError,
        isLoading: isLoadingQuests,
        mutate: mutateQuests,
    } = useSWR(
        questsKey,
        async ([url, uid]: [string, string]) => {
            const result = await RequestManager.get<Quest[]>(url, getToken);
            // Persist only real successful responses.
            if (Array.isArray(result)) writeCachedQuests(uid, url, result);
            return result;
        },
        { fallbackData: persistedQuests, revalidateOnMount: true },
    );
    // Never show quests without a signed-in user: guards sign-out / not-yet-loaded auth.
    const quests = questsUserId ? (swrQuests ?? persistedQuests) : undefined;
    // Spinner only when there is nothing for this exact user+URL (no SWR cache, no persisted copy).
    const showQuestsSpinner = isLoadingQuests && quests === undefined;
    const sortedQuests = useMemo(() => (quests ? sortQuestsByPointValue(quests) : []), [quests]);

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
        canFetch ? rewardsUrl : null,
        () => RequestManager.get<QuestReward[]>(rewardsUrl, getToken),
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
            <PageHeader
                title="Quests"
                rightContainer={
                    <Switch.Root
                        size="sm"
                        checked={showArchived}
                        onCheckedChange={(details) => setShowArchived(details.checked)}
                    >
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label textStyle="label" color="fg.muted">
                            Show archived
                        </Switch.Label>
                    </Switch.Root>
                }
            />

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

            {isMobile && (
                <Tabs.Root
                    value={activeSection}
                    onValueChange={(details) => setActiveSection(details.value as QuestsSection)}
                    fitted
                    maxW="fp.container"
                    mx="auto"
                    px="4"
                >
                    <Tabs.List>
                        <Tabs.Trigger value="quests">Quests</Tabs.Trigger>
                        <Tabs.Trigger value="rewards">Rewards</Tabs.Trigger>
                        <Tabs.Trigger value="history">History</Tabs.Trigger>
                    </Tabs.List>
                </Tabs.Root>
            )}

            {(!isMobile || activeSection === "quests") && (
                <LoadingWrapper isLoading={showQuestsSpinner}>
                    <ErrorWrapper error={questsError} errorMessage="Failed to load quests.">
                        <CardGrid>
                            <AddModelCard onClick={() => setIsQuestFormOpen(true)} title="Add Quest" />
                            {sortedQuests.map((quest) => (
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
                        </CardGrid>
                    </ErrorWrapper>
                </LoadingWrapper>
            )}

            {(!isMobile || activeSection === "rewards") && (
                <LoadingWrapper isLoading={isLoadingRewards}>
                    <ErrorWrapper error={rewardsError} errorMessage="Failed to load rewards.">
                        <CardGrid>
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
                        </CardGrid>
                    </ErrorWrapper>
                </LoadingWrapper>
            )}

            {(!isMobile || activeSection === "history") && (
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
            )}

            <QuestForm isOpen={isQuestFormOpen} onClose={onQuestFormClose} quest={selectedQuest} updateQuests={mutateQuests} />
            <RewardForm isOpen={isRewardFormOpen} onClose={onRewardFormClose} reward={selectedReward} updateRewards={mutateRewards} />
        </>
    );
}
