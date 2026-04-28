import { ClassList } from "@/components/dnd/class/ClassList";
import { RaceList } from "@/components/dnd/race/RaceList";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Box } from "@mui/material";

export function DndGlossaryPage() {
  return (
    <>
      <PageHeader title="DnD Glossary" leftContainer={<LinkButton url="/dnd" label="Characters" isForward={false} />} />
      <Box className="px-2 mt-2">
        <ClassList />
        <LinkButton url="/dnd/glossary/classes" label="Classes" />
      </Box>
      <Box className="px-2 mt-2">
        <RaceList />
        <LinkButton url="/dnd/glossary/races" label="Races" />
      </Box>
    </>
  );
}
