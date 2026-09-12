import { CharacterCard } from "@/components/dnd/CharacterCard";
import { CharacterForm } from "@/components/dnd/CharacterForm";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorWrapper } from "@/components/ui/ErrorWrapper";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Project } from "@/constants/Projects";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { Box, Grid, GridItem, Heading } from "@chakra-ui/react";
import { useState } from "react";
import useSWR from "swr";

export function DndPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState<Character>();
    const onClose = () => {
        setIsOpen(false);
        setSelectedCharacter(undefined);
    };
    const { data: characters, error, isLoading, mutate } = useSWR<Character[]>("/characters", () =>
        RequestManager.get<Character[]>("/characters"),
    );

    return (
        <>
            <PageHeader title="Dungeons & Dragons" rightContainer={<LinkButton url={`/projects/${Project.DnD}`} label="Project Details" />} />
            <Box px={2}>
                <Heading size="lg" textAlign="center">
                    Character Catalog
                </Heading>
                <LoadingWrapper isLoading={isLoading}>
                    <ErrorWrapper error={error} errorMessage="Failed to load characters.">
                        <Grid templateColumns="repeat(12, 1fr)" gap={2}>
                            <GridItem colSpan={{ base: 12, sm: 3 }}>
                                <AddModelCard onClick={() => setIsOpen(true)} title="Create Character" />
                            </GridItem>
                            {characters?.map((c) => (
                                <GridItem key={c.characterId} colSpan={{ base: 12, sm: 3 }}>
                                    <CharacterCard character={c} />
                                </GridItem>
                            ))}
                        </Grid>
                    </ErrorWrapper>
                </LoadingWrapper>
            </Box>
            <Box mt={2} display="flex" justifyContent="center">
                <LinkButton url="/dnd/glossary" label="Glossary" />
            </Box>
            <CharacterForm isOpen={isOpen} onClose={onClose} updateCharacters={mutate} character={selectedCharacter} />
        </>
    );
}
