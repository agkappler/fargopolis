import { ActionInfo } from "@/components/dnd/ActionInfo";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ImageBox } from "@/components/ui/ImageBox";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { Text } from "@chakra-ui/react";
import { capitalize } from "@/helpers/Format";
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
                leftContainer={<LinkButton label="Back to Character" url={`/dnd/${id}`} isForward={false} />}
            />
            {character && (
                <>
                    {character.avatarId && <ImageBox fileId={character.avatarId} altText="Character avatar" />}
                    <Text fontSize="md" textAlign="center" fontWeight="light" color="fg.secondary">
                        {`${capitalize(character.race)}, Level ${character.level} ${capitalize(character.className)}`}
                    </Text>
                    <ActionInfo characterId={character.characterId} className={character.className} />
                </>
            )}
        </LoadingWrapper>
    );
}
