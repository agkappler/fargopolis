import { Card, Text } from "@chakra-ui/react";
import React from "react";

type ModelCardProps = React.ComponentProps<typeof Card.Root> & {
    title?: string;
};

export const ModelCard: React.FC<ModelCardProps> = ({ title, onClick, children, ...rest }) => {
    return (
        <Card.Root
            alignItems="stretch"
            textAlign="start"
            role="button"
            onClick={onClick}
            {...rest}
        >
            {title && (
                <Text
                    fontFamily="display"
                    fontWeight="500"
                    fontSize="md"
                    color="fg.DEFAULT"
                    style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
                >
                    {title}
                </Text>
            )}
            {children}
        </Card.Root>
    );
};
