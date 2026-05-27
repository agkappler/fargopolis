import { Card, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

interface ModelCardProps extends PropsWithChildren {
    title: string;
    onClick?: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ title, onClick, children }) => {
    return (
        <Card.Root
            role={onClick ? "button" : undefined}
            onClick={onClick}
            cursor={onClick ? "pointer" : undefined}
        >
            <Card.Header>
                <Text fontFamily="display" fontWeight="500" fontSize="md" color="fg.DEFAULT"
                    style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}>
                    {title}
                </Text>
            </Card.Header>
            <Card.Body>
                {children}
            </Card.Body>
        </Card.Root>
    );
};
