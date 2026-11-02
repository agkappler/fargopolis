import { ProjectHero } from "@/components/home/ProjectHero";
import { ProjectSection } from "@/components/home/ProjectSection";
import { ProjectTodos } from "@/components/home/ProjectTodos";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { PROJECTS } from "@/constants/Projects";
import { getColorForProjectStatus } from "@/constants/Status";
import { hasExternalPage, isBlank, normalizeProse, splitTechnology } from "@/helpers/projectDisplay";
import { Badge, Box, Flex, Grid, GridItem, List, Stack, Text } from "@chakra-ui/react";
import { CircleCheck, Layers, Lightbulb, Target, Telescope } from "lucide-react";
import { useParams } from "react-router-dom";

export function ProjectDetailPage() {
  const { id } = useParams();
  const idx = id !== undefined ? Number(id) : NaN;
  const project = Number.isFinite(idx) ? PROJECTS[idx] : undefined;

  if (id === undefined || !Number.isFinite(idx) || !project) {
    return <ErrorMessage errorMessage="Project not found." />;
  }

  const motivation = isBlank(project.motivation) ? undefined : normalizeProse(project.motivation ?? "");
  const vision = isBlank(project.vision) ? undefined : normalizeProse(project.vision ?? "");
  const goals = (project.goals ?? []).filter((g) => !isBlank(g));
  const tech = splitTechnology(project.technology);
  const prev = idx > 0 ? PROJECTS[idx - 1] : undefined;
  const next = idx < PROJECTS.length - 1 ? PROJECTS[idx + 1] : undefined;

  return (
    <>
      <PageHeader
        back={{ label: "All Projects", url: "/projects" }}
        eyebrow="Project"
        title={project.name}
        rightContainer={hasExternalPage(project) ? <LinkButton label="View Project" url={project.url} /> : undefined}
      >
        <Flex align="center" gap="3" color="fg.muted">
          <Box display="flex" css={{ "& svg": { marginRight: 0 } }} aria-hidden="true">
            {project.icon}
          </Box>
          <StatusChip label={project.status} color={getColorForProjectStatus(project.status)} />
        </Flex>
      </PageHeader>

      <Box maxW="fp.container" mx="auto" px={{ base: "4", sm: "6" }} py="6">
        <ProjectHero project={project} key={idx} />

        <Grid templateColumns="repeat(12, 1fr)" gap="5" mt="6">
          <GridItem colSpan={{ base: 12, lg: 8 }}>
            <Stack gap="5">
              <ProjectSection icon={Lightbulb} title="Motivation" isPlaceholder={!motivation}>
                <Text lineHeight="tall">{motivation ?? "Divine inspiration."}</Text>
              </ProjectSection>

              <ProjectSection icon={Telescope} title="Vision" isPlaceholder={!vision}>
                <Text lineHeight="tall">
                  {vision ?? "I see something, it's too far away to make out clearly yet."}
                </Text>
              </ProjectSection>

              <ProjectSection icon={Target} title="Feature Goals" isPlaceholder={goals.length === 0}>
                {goals.length === 0 ? (
                  <Text>Add goals ;)</Text>
                ) : (
                  <List.Root variant="plain" gap="2">
                    {goals.map((g, index) => (
                      <List.Item key={index} display="flex" alignItems="flex-start" gap="2">
                        <List.Indicator asChild color="brand" flexShrink="0" mt="1">
                          <CircleCheck size={16} />
                        </List.Indicator>
                        {g}
                      </List.Item>
                    ))}
                  </List.Root>
                )}
              </ProjectSection>
            </Stack>
          </GridItem>

          <GridItem colSpan={{ base: 12, lg: 4 }}>
            <Stack gap="5">
              <ProjectSection icon={Layers} title="Tech Stack" isPlaceholder={tech.length === 0}>
                {tech.length === 0 ? (
                  <Text>All of the technologies.</Text>
                ) : (
                  <Flex wrap="wrap" gap="2">
                    {tech.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </Flex>
                )}
              </ProjectSection>

              <ProjectTodos todos={project.todo} />
            </Stack>
          </GridItem>
        </Grid>

        <Flex
          justify="space-between"
          gap="3"
          wrap="wrap"
          mt="8"
          pt="5"
          borderTop="1px solid"
          borderColor="border"
        >
          {prev ? (
            <LinkButton isForward={false} label={prev.name} url={`/projects/${idx - 1}`} />
          ) : (
            <Box />
          )}
          {next && <LinkButton label={next.name} url={`/projects/${idx + 1}`} />}
        </Flex>
      </Box>
    </>
  );
}
