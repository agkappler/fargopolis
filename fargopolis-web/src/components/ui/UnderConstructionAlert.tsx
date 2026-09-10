import { Alert } from "@chakra-ui/react";
import { Construction } from "lucide-react";
import React from "react";

export const UnderConstructionAlert: React.FC = () => {
    return (
        <Alert.Root status="warning" m="2" fontWeight="bold">
            <Alert.Indicator>
                <Construction />
            </Alert.Indicator>
            <Alert.Content>
                <Alert.Title>Under Construction</Alert.Title>
            </Alert.Content>
        </Alert.Root>
    );
};
