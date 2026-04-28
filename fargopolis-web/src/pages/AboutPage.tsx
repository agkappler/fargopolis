import { MyTimeline } from "@/components/about/MyTimeline";
import { ResumeWrapper } from "@/components/about/ResumeWrapper";
import { FileUpload } from "@/components/inputs/FileUpload";
import { GitHubButton } from "@/components/ui/buttons/GitHubButton";
import { LinkedInButton } from "@/components/ui/buttons/LinkedInButton";
import { FileRole } from "@/constants/FileRole";
import { Box, Divider, Grid, Paper, Typography } from "@mui/material";

export function AboutPage() {
  return (
    <Box className="flex flex-col justify-center align-items-center container mx-auto px-4 py-2">
      <Box borderRadius={75} overflow="hidden" margin="auto">
        <img src="/Alex_Kappler_Picture.jpg" alt="Alex Kappler" width={150} height={150} className="m-auto" />
      </Box>
      <Typography variant="h4" component="h1" textAlign="center">
        Alex Kappler
      </Typography>
      <Box display="flex" justifyContent="center" gap={2}>
        <LinkedInButton />
        <ResumeWrapper />
        <GitHubButton />
      </Box>
      <Divider className="pb-4" textAlign="center">
        Intro
      </Divider>
      <Typography variant="body1" marginBottom={2} textAlign="center">
        {
          "I’m a full-stack software engineer with a strong foundation in Computer Science from Colgate University and over five years of industry experience. I’ve contributed to enterprise and startup teams alike, building scalable web and mobile applications using technologies like Java, React, React Native, and PostgreSQL. My journey began with Python and Java in college and has since evolved into a passion for building clean, maintainable systems that solve real-world problems."
        }
      </Typography>
      <Divider className="pb-4" textAlign="center">
        Timeline
      </Divider>
      <MyTimeline />
      <Divider className="pb-4 w-full" sx={{ width: "100%" }} textAlign="center">
        Interests
      </Divider>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={3} className="p-2 text-center">
            <Typography variant="h6">Reading</Typography>
            <Typography variant="body1">
              {
                "I've always been a big reader and I recently finished working my way through everything in the Cosmere from Brandon Sanderson with my highlight being everything from The Stormlight Archive."
              }
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={3} className="p-2 text-center">
            <Typography variant="h6">Sports</Typography>
            <Typography variant="body1">
              {
                "I enjoy being active and playing Soccer and Ultimate Frisbee when the weather permits and Nordic and Alpine skiing in the winter."
              }
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={3} className="p-2 text-center">
            <Typography variant="h6">Misc.</Typography>
            <Typography variant="body1">
              {
                "F1 (Ferrari, even though they sometimes hurt me emotionally), Video Games (Destiny 2 and The Finals), Dan Carlin's Hardcore History podcast."
              }
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      <FileUpload label="Upload Resume" fileRole={FileRole.Resume} />
    </Box>
  );
}
