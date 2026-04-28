import { FARGOPOLIS_BLURB } from '@/constants/Projects';
import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import { Typography } from '@mui/material';
import { TimelineContentText } from './TimelineContentText';

export const MyTimeline: React.FC = () => {
    const imageStyle = { height: "100px" };
    return (
        <Timeline position="alternate">
            <TimelineItem sx={{ "::before": { display: "none" } }}>
                <TimelineOppositeContent display="flex" flexDirection="row-reverse" alignItems="center" gap={2} color="text.secondary">
                    <Typography variant="body1">2015</Typography>
                    <img src="/colgate_c.png" alt="Colgate C" width={100} height={100} style={imageStyle} />
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineConnector />
                    <TimelineDot />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContentText
                    title="Enroll at Colgate University"
                    content="I went into college thinking I would end up with either a Math or Molecular Biology degree, but I found out sophomore year that I really wasn't that interested in either of them."
                />
            </TimelineItem>
            <TimelineItem>
                <TimelineOppositeContent display="flex" alignItems="center" gap={2} color="text.secondary">
                    <Typography variant="body1">2018</Typography>
                    <img src="/sciencelogic_logo.png" alt="ScienceLogic Logo" width={200} height={100} style={imageStyle} />
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineConnector />
                    <TimelineDot />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContentText
                    title="Winter internship at ScienceLogic"
                    content="Squezed in an internship before going abroad for the spring semester of my junior year. My project was building a very simple Splunk-like log search tool using Python with the Django framework and some simple JavaScript with JQuery on the frontend."
                />
            </TimelineItem>
            <TimelineItem>
                <TimelineOppositeContent display="flex" flexDirection="row-reverse" alignItems="center" gap={2} color="text.secondary">
                    <Typography variant="body1">2019</Typography>
                    <img src="/colgate_crest.png" alt="Colgate Crest" width={100} height={100} style={imageStyle} />
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineConnector />
                    <TimelineDot />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContentText
                    title="Graduate from Colgate University"
                    content="I ended up graduating Magna Cum Laude with a Bachelors Degree in Computer Science at the top of the department with a GPA of 3.9. I also received a minor in Geology and came pretty close to another in German, and I absolutely loved the liberal arts experience."
                />
            </TimelineItem>
            <TimelineItem>
                <TimelineOppositeContent display="flex" alignItems="center" gap={2} color="text.secondary">
                    <Typography variant="body1">2019</Typography>
                    <img src="/alarm_logo.png" alt="Alarm.com Logo" width={100} height={100} style={{ ...imageStyle, width: "120px" }} />
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineConnector />
                    <TimelineDot />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContentText
                    title="Start work at Alarm.com"
                    content="I started my career as a Software Engineer at Alarm.com, where I worked for 5 years delivering scalable full-stack web features in C#, SQL Server, and Ember.js. I led high-stakes projects, conducted design reviews, and helped migrate legacy code to a modern tech stack—all while mentoring junior engineers and driving collaborative development across teams."
                />
            </TimelineItem>
            <TimelineItem>
                <TimelineOppositeContent display="flex" flexDirection="row-reverse" alignItems="center" gap={2} color="text.secondary">
                    <Typography variant="body1">2024</Typography>
                    <img src="/wealthteamwork_logo.jpeg" alt="WealtTeamWork Logo" width={110} height={100} style={{ ...imageStyle, }} />
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineConnector />
                    <TimelineDot />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContentText
                    title="Join WealthTeamWork"
                    content="I joined WealthTeamWork to work on an exciting new application in the financial management space. I contributed across the full stack, building web and mobile features using React, React Native, Java, and PostgreSQL. I led efforts to standardize code into shared components, reduce regression testing time through automation, and improve the development lifecycle with scripting and environment enhancements. I also actively influenced technical and product direction by shaping specs and designs."
                />
            </TimelineItem>
            <TimelineItem>
                <TimelineOppositeContent display="flex" alignItems="center" gap={2} color="text.secondary">
                    <Typography variant="body1">2025</Typography>
                    <img src="/logo.png" alt="Fargopolis Logo" width={200} height={100} style={{ ...imageStyle }} />
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineConnector />
                    <TimelineDot />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContentText
                    title="Launch Fargopolis.com"
                    content={FARGOPOLIS_BLURB}
                />
            </TimelineItem>
        </Timeline>
    );
}