import { ClassList } from "@/components/dnd/class/ClassList";
import { RaceList } from "@/components/dnd/race/RaceList";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Box } from "@chakra-ui/react";

export function DndGlossaryPage() {
  return (
    <>
      <PageHeader title="DnD Glossary" leftContainer={<LinkButton url="/dnd" label="Characters" isForward={false} />} />
      <Box px={2} mt={2}>
        <ClassList />
        <LinkButton url="/dnd/glossary/classes" label="Classes" />
      </Box>
      <Box px={2} mt={2}>
        <RaceList />
        <LinkButton url="/dnd/glossary/races" label="Races" />
      </Box>
    </>
  );
}
