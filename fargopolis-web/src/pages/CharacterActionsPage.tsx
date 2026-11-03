import { ActionInfo } from "@/components/dnd/ActionInfo";
import { CharacterSubtitle } from "@/components/dnd/CharacterSubtitle";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { Box } from "@chakra-ui/react";
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
            />
            {character && (
                <Box maxW="fp.container" mx="auto" px="4" py="6">
                    <CharacterSubtitle character={character} />
                    <ActionInfo characterId={character.characterId} className={character.className} />
                </Box>
            )}
        </LoadingWrapper>
    );
}
