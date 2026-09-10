import { ProjectHeader } from "@/components/home/ProjectHeader";
import { ProjectTodos } from "@/components/home/ProjectTodos";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { surfaceCardProps } from "@/components/ui/surfaceStyle";
import { PROJECTS } from "@/constants/Projects";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Box, Grid, GridItem, Heading, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";

export function ProjectDetailPage() {
  const { id } = useParams();
  const idx = id !== undefined ? Number(id) : NaN;
  const project = Number.isFinite(idx) ? PROJECTS[idx] : undefined;

  if (id === undefined || !Number.isFinite(idx) || !project) {
    return <ErrorMessage errorMessage="Project not found." />;
  }

  return (
    <>
      <PageHeader
        leftContainer={<LinkButton label="All Projects" url="/projects" isForward={false} />}
        rightContainer={project.url ? <LinkButton label="View Project" url={project.url} /> : undefined}
      >
        <ProjectHeader project={project} variant="h4" />
      </PageHeader>
      <Text textAlign="center">
        {project.description}
      </Text>
      <Grid templateColumns="repeat(12, 1fr)" gap={4} className="m-2">
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <Box {...surfaceCardProps} boxShadow="md" className="p-2 h-full">
            <Heading size="md" textAlign="center">
              Motivation
            </Heading>
            <Text textAlign="center">
              {project.motivation ?? "Divine inspiration."}
            </Text>
          </Box>
        </GridItem>
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <Box {...surfaceCardProps} boxShadow="md" className="p-2 h-full">
            <Heading size="md" textAlign="center">
              Vision
            </Heading>
            <Text textAlign="center">
              {project.vision ?? "I see something, it's too far away to make out clearly yet."}
            </Text>
          </Box>
        </GridItem>
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <Box {...surfaceCardProps} boxShadow="md" className="p-2 h-full">
            <Heading size="md" textAlign="center">
              Feature Goals
            </Heading>
            {(project.goals ?? ["Add goals ;)"]).map((g, index) => (
              <Text key={index} textAlign="center">
                {g}
              </Text>
            ))}
          </Box>
        </GridItem>
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <Box {...surfaceCardProps} boxShadow="md" className="p-2 h-full">
            <Heading size="md" textAlign="center">
              Tech Breakdown
            </Heading>
            <Text textAlign="center">
              {project.technology ?? "All of the technologies."}
            </Text>
          </Box>
        </GridItem>
        <GridItem colSpan={{ base: 12, md: 6 }}>
          <ProjectTodos todos={project.todo} />
        </GridItem>
      </Grid>
    </>
  );
}
