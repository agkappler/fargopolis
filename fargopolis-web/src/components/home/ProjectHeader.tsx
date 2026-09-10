import { IProject } from "@/constants/Projects";
import { Box, Heading } from "@chakra-ui/react";

type HeadingVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface ProjectHeaderProps {
    project: IProject;
    variant?: HeadingVariant;
}

const VARIANT_SIZE: Record<HeadingVariant, "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl"> = {
    h1: "4xl",
    h2: "3xl",
    h3: "2xl",
    h4: "xl",
    h5: "lg",
    h6: "md",
};

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, variant = "h6" }) => {
    return <Box className="flex items-center justify-center w-full">
        {project.icon}
        <Heading size={VARIANT_SIZE[variant]}>{project.name}</Heading>
    </Box>
}
