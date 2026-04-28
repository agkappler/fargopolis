import { ProjectCardContents } from "@/components/home/ProjectCardContents";
import { PageHeader } from "@/components/ui/PageHeader";
import { PROJECTS } from "@/constants/Projects";
import { Grid, Paper } from "@mui/material";

export function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" />
      <Grid container spacing={2} margin={2}>
        {PROJECTS.map((project, index) => (
          <Grid key={index} size={4}>
            <Paper elevation={3} className="flex flex-col p-2 items-center h-full">
              <ProjectCardContents project={project} index={index} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
