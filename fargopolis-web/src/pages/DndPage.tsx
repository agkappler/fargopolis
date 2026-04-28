import { CharacterCard } from "@/components/dnd/CharacterCard";
import { CharacterForm } from "@/components/dnd/CharacterForm";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Project } from "@/constants/Projects";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { Box, Grid, Typography } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

export function DndPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>();
  const onClose = () => {
    setIsOpen(false);
    setSelectedCharacter(undefined);
  };
  const { data: characters, isLoading, mutate } = useSWR<Character[]>("/characters", () =>
    RequestManager.getGateway<Character[]>("/characters"),
  );

  return (
    <>
      <PageHeader title="Dungeons & Dragons" rightContainer={<LinkButton url={`/projects/${Project.DnD}`} label="Project Details" />} />
      <Box className="px-2">
        <Typography variant="h5" textAlign="center">
          Character Catalog
        </Typography>
        <LoadingWrapper isLoading={isLoading}>
          <Grid container spacing={1}>
            <Grid size={{ sm: 3, xs: 12 }}>
              <AddModelCard onClick={() => setIsOpen(true)} title="Create Character" />
            </Grid>
            {characters?.map((c) => (
              <Grid key={c.characterId} size={{ sm: 3, xs: 12 }}>
                <CharacterCard character={c} />
              </Grid>
            ))}
          </Grid>
        </LoadingWrapper>
      </Box>
      <Box className="mt-2" display="flex" justifyContent="center">
        <LinkButton url="/dnd/glossary" label="Glossary" />
      </Box>
      <CharacterForm isOpen={isOpen} onClose={onClose} updateCharacters={mutate} character={selectedCharacter} />
    </>
  );
}
