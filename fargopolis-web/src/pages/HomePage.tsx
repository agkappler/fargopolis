import { Carousel } from "@/components/ui/Carousel";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { FARGOPOLIS_BLURB, PROJECTS } from "@/constants/Projects";
import { ProjectCardContents } from "@/components/home/ProjectCardContents";
import { Box, Flex, Text } from "@chakra-ui/react";

export function HomePage() {
    return (
        <>
            {/* Hero */}
            <Box
                as="section"
                bg="pine.900"
                color="fg.onDark"
                py="16"
                px="6"
                textAlign="center"
                position="relative"
                overflow="hidden"
                borderBottom="3px solid"
                borderBottomColor="ember.500"
                _before={{
                    content: '""',
                    position: "absolute",
                    inset: "0",
                    backgroundImage:
                        "radial-gradient(circle at 18% 80%, rgba(74,110,84,.45) 0, transparent 55%), radial-gradient(circle at 82% 20%, rgba(194,90,48,.18) 0, transparent 45%)",
                    opacity: 0.9,
                }}
            >
                <Flex
                    direction="column"
                    align="center"
                    maxW="var(--fp-container-narrow)"
                    mx="auto"
                    position="relative"
                >
                    <Text
                        fontFamily="mono"
                        fontSize="2xs"
                        letterSpacing="0.18em"
                        textTransform="uppercase"
                        color="ember.200"
                        mb="4"
                    >
                        Personal projects · Established 2025
                    </Text>
                    <img
                        src="/logo.png"
                        alt="Fargopolis"
                        style={{
                            maxWidth: 380,
                            width: "80%",
                            filter: "invert(1) brightness(1.05) contrast(.95)",
                        }}
                    />
                    <Text
                        fontSize="xs"
                        lineHeight="1.55"
                        maxW="520px"
                        color="stone.200"
                        mt="4"
                    >
                        {FARGOPOLIS_BLURB}
                    </Text>
                </Flex>
            </Box>

            {/* Project carousel */}
            <Box mt="8" mb="4">
                <Carousel
                    cardContents={PROJECTS.map((project, index) => (
                        <ProjectCardContents project={project} index={index} key={index} />
                    ))}
                />
                <Flex justify="center" mt="4">
                    <LinkButton url="/projects" label="View All Projects" />
                </Flex>
            </Box>
        </>
    );
}
