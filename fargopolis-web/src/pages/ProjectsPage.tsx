import { ProjectCardContents } from "@/components/home/ProjectCardContents";
import { PageHeader } from "@/components/ui/PageHeader";
import { surfaceCardProps } from "@/components/ui/surfaceStyle";
import { PROJECTS } from "@/constants/Projects";
import { Box, Grid, GridItem } from "@chakra-ui/react";

export function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" />
      <Grid templateColumns="repeat(12, 1fr)" gap={4} margin={2}>
        {PROJECTS.map((project, index) => (
          <GridItem key={index} colSpan={{ base: 12, sm: 4 }}>
            <Box {...surfaceCardProps} boxShadow="md" className="flex flex-col p-2 items-center h-full">
              <ProjectCardContents project={project} index={index} />
            </Box>
          </GridItem>
        ))}
      </Grid>
    </>
  );
}
