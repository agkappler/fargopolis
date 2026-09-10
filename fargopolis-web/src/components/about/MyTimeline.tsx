import { FARGOPOLIS_BLURB } from '@/constants/Projects';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { TimelineContentText } from './TimelineContentText';

interface TimelineEntry {
    year: string;
    img: string;
    imgAlt: string;
    imgWidth: number;
    title: string;
    content: string;
}

const ENTRIES: TimelineEntry[] = [
    {
        year: "2015",
        img: "/colgate_c.png",
        imgAlt: "Colgate C",
        imgWidth: 100,
        title: "Enroll at Colgate University",
        content: "I went into college thinking I would end up with either a Math or Molecular Biology degree, but I found out sophomore year that I really wasn't that interested in either of them.",
    },
    {
        year: "2018",
        img: "/sciencelogic_logo.png",
        imgAlt: "ScienceLogic Logo",
        imgWidth: 200,
        title: "Winter internship at ScienceLogic",
        content: "Squezed in an internship before going abroad for the spring semester of my junior year. My project was building a very simple Splunk-like log search tool using Python with the Django framework and some simple JavaScript with JQuery on the frontend.",
    },
    {
        year: "2019",
        img: "/colgate_crest.png",
        imgAlt: "Colgate Crest",
        imgWidth: 100,
        title: "Graduate from Colgate University",
        content: "I ended up graduating Magna Cum Laude with a Bachelors Degree in Computer Science at the top of the department with a GPA of 3.9. I also received a minor in Geology and came pretty close to another in German, and I absolutely loved the liberal arts experience.",
    },
    {
        year: "2019",
        img: "/alarm_logo.png",
        imgAlt: "Alarm.com Logo",
        imgWidth: 120,
        title: "Start work at Alarm.com",
        content: "I started my career as a Software Engineer at Alarm.com, where I worked for 5 years delivering scalable full-stack web features in C#, SQL Server, and Ember.js. I led high-stakes projects, conducted design reviews, and helped migrate legacy code to a modern tech stack—all while mentoring junior engineers and driving collaborative development across teams.",
    },
    {
        year: "2024",
        img: "/wealthteamwork_logo.jpeg",
        imgAlt: "WealtTeamWork Logo",
        imgWidth: 110,
        title: "Join WealthTeamWork",
        content: "I joined WealthTeamWork to work on an exciting new application in the financial management space. I contributed across the full stack, building web and mobile features using React, React Native, Java, and PostgreSQL. I led efforts to standardize code into shared components, reduce regression testing time through automation, and improve the development lifecycle with scripting and environment enhancements. I also actively influenced technical and product direction by shaping specs and designs.",
    },
    {
        year: "2025",
        img: "/logo.png",
        imgAlt: "Fargopolis Logo",
        imgWidth: 200,
        title: "Launch Fargopolis.com",
        content: FARGOPOLIS_BLURB,
    },
];

const OppositeContent: React.FC<{ entry: TimelineEntry; align: "start" | "end" }> = ({ entry, align }) => (
    <Flex
        flexDirection={align === "end" ? "row" : "row-reverse"}
        alignItems="center"
        justifyContent={align === "end" ? "flex-end" : "flex-start"}
        gap={2}
        color="fg.secondary"
    >
        <Text>{entry.year}</Text>
        <img
            src={entry.img}
            alt={entry.imgAlt}
            width={entry.imgWidth}
            height={100}
            style={{ height: "100px", width: `${entry.imgWidth}px`, mixBlendMode: "darken" }}
        />
    </Flex>
);

const Rail: React.FC = () => (
    <Flex direction="column" alignItems="center" alignSelf="stretch">
        <Box flex="1" w="2px" bg="border.strong" />
        <Box boxSize="12px" borderRadius="full" bg="brand.DEFAULT" my={1} flexShrink="0" />
        <Box flex="1" w="2px" bg="border.strong" />
    </Flex>
);

export const MyTimeline: React.FC = () => {
    return (
        <Box>
            {ENTRIES.map((entry, index) => {
                const oppositeOnLeft = index % 2 === 0;
                return (
                    <Grid
                        key={`${entry.year}-${index}`}
                        templateColumns={{ base: "24px 1fr", md: "1fr 24px 1fr" }}
                        columnGap={4}
                        alignItems="center"
                        py={2}
                    >
                        {/* desktop-only left cell */}
                        <Box display={{ base: "none", md: "block" }}>
                            {oppositeOnLeft
                                ? <OppositeContent entry={entry} align="end" />
                                : <TimelineContentText title={entry.title} content={entry.content} />}
                        </Box>

                        <Rail />

                        {/* right cell (also the only content column on mobile) */}
                        <Box>
                            <Box display={{ base: "none", md: "block" }}>
                                {oppositeOnLeft
                                    ? <TimelineContentText title={entry.title} content={entry.content} />
                                    : <OppositeContent entry={entry} align="start" />}
                            </Box>
                            <Box display={{ base: "block", md: "none" }}>
                                <TimelineContentText title={entry.title} content={entry.content} />
                                <Box mt={2}>
                                    <OppositeContent entry={entry} align="start" />
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                );
            })}
        </Box>
    );
}
