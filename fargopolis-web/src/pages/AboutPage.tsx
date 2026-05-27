import { MyTimeline } from "@/components/about/MyTimeline";
import { ResumeWrapper } from "@/components/about/ResumeWrapper";
import { FileUpload } from "@/components/inputs/FileUpload";
import { GitHubButton } from "@/components/ui/buttons/GitHubButton";
import { LinkedInButton } from "@/components/ui/buttons/LinkedInButton";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { FileRole } from "@/constants/FileRole";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";

const INTERESTS = [
    {
        title: "Reading",
        body: "I've always been a big reader and I recently finished working my way through everything in the Cosmere from Brandon Sanderson with my highlight being everything from The Stormlight Archive.",
    },
    {
        title: "Sports",
        body: "I enjoy being active and playing Soccer and Ultimate Frisbee when the weather permits and Nordic and Alpine skiing in the winter.",
    },
    {
        title: "Misc.",
        body: "F1 (Ferrari, even though they sometimes hurt me emotionally), Video Games (Destiny 2 and The Finals), Dan Carlin's Hardcore History podcast.",
    },
];

export function AboutPage() {
    return (
        <Box maxW="var(--fp-container)" mx="auto" px="6" py="8">
            {/* Hero card */}
            <Flex
                gap="6"
                align={{ base: "flex-start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                bg="bg.raised"
                border="1px solid"
                borderColor="border.DEFAULT"
                borderLeft="4px solid"
                borderLeftColor="pine.500"
                borderRadius="md"
                boxShadow="sm"
                p="6"
                mb="8"
            >
                <Box
                    flexShrink="0"
                    w={{ base: "80px", md: "120px" }}
                    h={{ base: "80px", md: "120px" }}
                    borderRadius="full"
                    overflow="hidden"
                    border="2px solid"
                    borderColor="pine.300"
                >
                    <img
                        src="/Alex_Kappler_Picture.jpg"
                        alt="Alex Kappler"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                </Box>

                <Box flex="1">
                    <Text
                        as="h1"
                        m="0"
                        mb="1"
                        textStyle="display-title"
                        fontSize={{ base: "2xl", md: "3xl" }}
                        color="fg.DEFAULT"
                        style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
                    >
                        Alex Kappler
                    </Text>
                    <Text textStyle="eyebrow" color="ember.600" display="block" mb="3">
                        Full-Stack Software Engineer
                    </Text>

                    <Flex gap="2" mb="4" flexWrap="wrap">
                        <LinkedInButton />
                        <ResumeWrapper />
                        <GitHubButton />
                    </Flex>

                    <Text as="p" m="0" fontSize="sm" color="fg.secondary" lineHeight="1.65" maxW="60ch">
                        I'm a full-stack software engineer with a strong foundation in Computer Science from
                        Colgate University and over five years of industry experience. I've contributed to
                        enterprise and startup teams alike, building scalable web and mobile applications
                        using technologies like Java, React, React Native, and PostgreSQL.
                    </Text>
                </Box>
            </Flex>

            <SectionDivider label="Timeline" />
            <MyTimeline />

            <SectionDivider label="Interests" mt="8" />
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="4" mb="6">
                {INTERESTS.map(({ title, body }) => (
                    <Box
                        key={title}
                        bg="bg.sunk"
                        border="1px solid"
                        borderColor="border.DEFAULT"
                        borderRadius="md"
                        p="5"
                    >
                        <Text
                            as="h3"
                            m="0"
                            mb="2"
                            textStyle="display-title"
                            fontSize="md"
                            color="fg.DEFAULT"
                            style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
                        >
                            {title}
                        </Text>
                        <Text fontSize="sm" color="fg.secondary" lineHeight="1.6" m="0">
                            {body}
                        </Text>
                    </Box>
                ))}
            </Grid>

            <FileUpload label="Upload Resume" fileRole={FileRole.Resume} />
        </Box>
    );
}
