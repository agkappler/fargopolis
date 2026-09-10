import { Box, List, Text } from "@chakra-ui/react";
import { Circle } from "lucide-react";
import { surfaceCardProps } from "../ui/surfaceStyle";

interface ProjectTodosProps {
    todos: string[];
}

export const ProjectTodos: React.FC<ProjectTodosProps> = ({ todos }) => {
    return <Box {...surfaceCardProps} boxShadow="md" p={2} h="full">
        <Text fontWeight="medium">Todo:</Text>
        <List.Root variant="plain" gap={2} mt={2}>
            {todos.map((item, index) => (
                <List.Item key={index} display="flex" alignItems="center" gap={2}>
                    <List.Indicator asChild color="fg.muted">
                        <Circle size={12} fill="currentColor" />
                    </List.Indicator>
                    {item}
                </List.Item>
            ))}
        </List.Root>
    </Box>
}
