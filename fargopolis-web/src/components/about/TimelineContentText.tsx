import { Box, Text } from "@chakra-ui/react"

interface TimelineContentTextProps {
    title: string;
    content: string;
}

export const TimelineContentText: React.FC<TimelineContentTextProps> = ({ title, content }) => {
    return <Box>
        <Text fontWeight="medium" textAlign="center">{title}</Text>
        <Text fontSize="sm" textAlign="center">
            {content}
        </Text>
    </Box>
}
