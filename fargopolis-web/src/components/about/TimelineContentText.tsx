import TimelineContent from "@mui/lab/TimelineContent"
import { Typography } from "@mui/material"

interface TimelineContentTextProps {
    title: string;
    content: string;
}

export const TimelineContentText: React.FC<TimelineContentTextProps> = ({ title, content }) => {
    return <TimelineContent>
        <Typography variant="subtitle1" textAlign="center">{title}</Typography>
        <Typography variant="body2" textAlign="center">
            {content}
        </Typography>
    </TimelineContent>
}