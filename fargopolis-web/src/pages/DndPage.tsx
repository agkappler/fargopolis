import { CharacterCard } from "@/components/dnd/CharacterCard";
import { CharacterCreateWizard } from "@/components/dnd/CharacterCreateWizard";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorWrapper } from "@/components/ui/ErrorWrapper";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Project } from "@/constants/Projects";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { Box, Grid, Heading } from "@chakra-ui/react";
import { useState } from "react";
import useSWR from "swr";

export function DndPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data: characters, error, isLoading, mutate } = useSWR<Character[]>("/characters", () =>
        RequestManager.get<Character[]>("/characters"),
    );
    const closeCreate = () => setIsCreateOpen(false);

    return (
        <>
            <PageHeader
                title="Dungeons & Dragons"
                rightContainer={
                    <>
                        <LinkButton url="/dnd/glossary" label="Glossary" />
                        <LinkButton url={`/projects/${Project.DnD}`} label="Project Details" />
                    </>
                }
            />
            <Box maxW="fp.container" mx="auto" px="4" py="6">
                <Heading size="lg" textAlign="center" mb="4">
                    Character Catalog
                </Heading>
                <LoadingWrapper isLoading={isLoading}>
                    <ErrorWrapper error={error} errorMessage="Failed to load characters.">
                        <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap="4">
                            <AddModelCard onClick={() => setIsCreateOpen(true)} title="Create Character" />
                            {characters?.map((c) => (
                                <CharacterCard key={c.characterId} character={c} />
                            ))}
                        </Grid>
                    </ErrorWrapper>
                </LoadingWrapper>
            </Box>
            {/*
                Always mounted (SimpleDialog's own unmountOnExit already drops the wizard's
                content when closed, so no state carries over between openings). Toggling the
                wizard in/out of the tree here instead of via isOpen skipped Dialog.Root's close
                transition, so its body scroll-lock cleanup could race the SWR mutate below and
                leave document.body stuck with pointer-events: none.
            */}
            <CharacterCreateWizard
                isOpen={isCreateOpen}
                onClose={closeCreate}
                updateCharacters={() => void mutate()}
            />
        </>
    );
}
