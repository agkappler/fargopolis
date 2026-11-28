import { CharacterForm } from "@/components/dnd/character/CharacterForm";
import { CharacterInfo } from "@/components/dnd/character/CharacterInfo";
import { CharacterSubtitle } from "@/components/dnd/CharacterSubtitle";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ImageBox } from "@/components/ui/ImageBox";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { Pencil, Swords } from "lucide-react";
import { Box, Button, Flex } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import useSWR from "swr";

export function CharacterDetailPage() {
    const { id } = useParams();
    const [isOpen, setIsOpen] = useState(false);
    const { data: character, isLoading, error, mutate } = useSWR<Character>(
        id ? `/character/${id}` : null,
        () => RequestManager.get<Character>(`/character/${id}`),
    );

    if (!id) return <ErrorMessage errorMessage="Missing character id." />;
    if (error) return <ErrorMessage errorMessage={error.message} />;
    return (
        <>
            <LoadingWrapper isLoading={isLoading}>
                <PageHeader
                    title={character?.name}
                    back={{ label: "All Characters", url: "/dnd" }}
                    avatar={<ImageBox fileId={character?.avatarId} altText="Character avatar" size={{ base: 48, sm: 64 }} />}
                    rightContainer={
                        <Flex gap="2">
                            <Button size="md" minH="10" variant="outline" onClick={() => setIsOpen(true)}>
                                <Pencil size={16} />
                                Edit
                            </Button>
                            <Button asChild size="md" minH="10" variant="primary">
                                <RouterLink to={`/dnd/${id}/actions`}>
                                    <Swords size={16} />
                                    Play
                                </RouterLink>
                            </Button>
                        </Flex>
                    }
                >
                    {character && <CharacterSubtitle character={character} />}
                </PageHeader>
                {character && (
                    <Box maxW="fp.container" mx="auto" px="4" py="6">
                        <CharacterInfo character={character} onEdit={() => setIsOpen(true)} />
                    </Box>
                )}
            </LoadingWrapper>
            <CharacterForm isOpen={isOpen} onClose={() => setIsOpen(false)} updateCharacters={mutate} character={character} />
        </>
    );
}
