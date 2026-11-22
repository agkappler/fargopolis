import { AbilityScoresBlock } from "@/components/dnd/AbilityScoresBlock";
import { ActionInfo } from "@/components/dnd/ActionInfo";
import { CharacterSubtitle } from "@/components/dnd/CharacterSubtitle";
import { CombatStatsBlock } from "@/components/dnd/CombatStatsBlock";
import { HitPointsBlock } from "@/components/dnd/HitPointsBlock";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ImageBox } from "@/components/ui/ImageBox";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { Box, Flex } from "@chakra-ui/react";
import useSWR from "swr";
import { useParams } from "react-router-dom";

export function CharacterActionsPage() {
    const { id } = useParams();
    const { data: character, isLoading: isLoadingCharacter, error } = useSWR<Character>(
        id ? `/character/${id}` : null,
        () => RequestManager.get<Character>(`/character/${id}`),
    );

    if (!id) return <ErrorMessage errorMessage="Missing character id." />;
    if (error) return <ErrorMessage errorMessage={error.message} />;

    return (
        <LoadingWrapper isLoading={isLoadingCharacter}>
            <PageHeader
                title={character?.name}
                back={{ label: "Back to Character", url: `/dnd/${id}` }}
                avatar={<ImageBox fileId={character?.avatarId} altText="Character avatar" size={{ base: 48, sm: 64 }} />}
            >
                {character && <CharacterSubtitle character={character} />}
            </PageHeader>
            {character && (
                <Box maxW="fp.container" mx="auto" px="4" py="6">
                    <Flex direction={{ base: "column", md: "row" }} align="flex-start" gap="4" mb="4">
                        <Box flex={{ base: "1 1 auto", md: "1" }} minW={{ base: "full", md: "0" }}>
                            <AbilityScoresBlock character={character} />
                        </Box>
                        <Box flex={{ base: "1 1 auto", md: "1" }} minW={{ base: "full", md: "0" }}>
                            <CombatStatsBlock character={character} />
                        </Box>
                        <Box flex={{ base: "1 1 auto", md: "1" }} minW={{ base: "full", md: "0" }}>
                            <HitPointsBlock character={character} />
                        </Box>
                    </Flex>
                    <ActionInfo character={character} />
                </Box>
            )}
        </LoadingWrapper>
    );
}
