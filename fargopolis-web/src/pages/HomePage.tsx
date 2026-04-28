import { Carousel } from "@/components/ui/Carousel";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { MOBILE_BREAK } from "@/constants/Media";
import { FARGOPOLIS_BLURB, PROJECTS } from "@/constants/Projects";
import { ProjectCardContents } from "@/components/home/ProjectCardContents";
import { Box, Link as MuiLink, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export function HomePage() {
  return (
    <>
      <Box textAlign="center">
        <Box
          sx={{
            background: "linear-gradient(to right, #6a11cb, #2575fc)",
            color: "white",
            padding: "2rem 1rem",
            marginTop: 2,
          }}
        >
          <Typography variant="h4">Welcome!</Typography>
        </Box>
        <Box marginX="auto" marginTop={2} className="w-full">
          <img src="/logo.png" alt="Fargopolis Logo" width={300} height={150} className="m-auto" />
        </Box>
        <Typography variant="body1" marginTop={1} maxWidth={MOBILE_BREAK} marginX="auto" padding={1}>
          {FARGOPOLIS_BLURB}
        </Typography>
        <Typography variant="body1" marginTop={1} marginX="auto">
          You can find out more about me{" "}
          <MuiLink component={RouterLink} to="/about" color="inherit">
            here
          </MuiLink>
          .
        </Typography>
      </Box>

      <Box marginTop={2}>
        <Box
          sx={{
            background: "linear-gradient(to right, #6a11cb, #2575fc)",
            color: "white",
            padding: "2rem 1rem",
            marginBottom: 4,
          }}
        >
          <Typography variant="h5" textAlign="center">
            Explore My Projects
          </Typography>
        </Box>
        <Carousel
          cardContents={PROJECTS.map((project, index) => (
            <ProjectCardContents project={project} index={index} key={index} />
          ))}
        />
        <Box justifyContent="center" display="flex" marginTop={2}>
          <LinkButton url="/projects" label="View All Projects" />
        </Box>
      </Box>
    </>
  );
}
