import { IProject } from "@/constants/Projects";
import { isBlank } from "@/helpers/projectDisplay";
import { Flex, Grid, Image, Text } from "@chakra-ui/react";
import { useState } from "react";
import { surfaceBorderProps } from "../ui/surfaceStyle";

interface ProjectHeroProps {
    project: IProject;
}

export const ProjectHero: React.FC<ProjectHeroProps> = ({ project }) => {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = !isBlank(project.imageUrl) && !imageFailed;

    return (
        <Grid templateColumns={{ base: "1fr", md: "240px 1fr" }} gap="5" alignItems="center">
            {showImage ? (
                <Image
                    src={project.imageUrl}
                    alt={project.name}
                    objectFit="cover"
                    w="full"
                    h="160px"
                    borderRadius="md"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                // Project icons are prebuilt nodes with an inline margin, so resize via CSS.
                <Flex
                    {...surfaceBorderProps}
                    bg="bg.sunk"
                    h="160px"
                    align="center"
                    justify="center"
                    color="accent"
                    aria-hidden="true"
                    css={{ "& svg": { width: "56px", height: "56px", marginRight: 0 } }}
                >
                    {project.icon}
                </Flex>
            )}
            <Text fontSize="md" color="fg.secondary" lineHeight="tall">
                {project.description}
            </Text>
        </Grid>
    );
};
