import { Badge, List, Text } from "@chakra-ui/react";
import { Circle, ListTodo } from "lucide-react";
import { ProjectSection } from "./ProjectSection";

interface ProjectTodosProps {
    todos: string[];
}

export const ProjectTodos: React.FC<ProjectTodosProps> = ({ todos }) => {
    const isEmpty = todos.length === 0;
    return (
        <ProjectSection
            icon={ListTodo}
            title="Todo"
            isPlaceholder={isEmpty}
            headerExtra={isEmpty ? undefined : <Badge variant="subtle">{todos.length}</Badge>}
        >
            {isEmpty ? (
                <Text>Nothing on the list right now.</Text>
            ) : (
                <List.Root variant="plain" gap="0">
                    {todos.map((item, index) => (
                        <List.Item
                            key={index}
                            display="flex"
                            alignItems="center"
                            gap="3"
                            py="2"
                            borderBottom="1px solid"
                            borderColor="border.soft"
                            _last={{ borderBottom: "none" }}
                        >
                            <List.Indicator asChild color="fg.muted" flexShrink="0">
                                <Circle size={14} />
                            </List.Indicator>
                            {item}
                        </List.Item>
                    ))}
                </List.Root>
            )}
        </ProjectSection>
    );
};
