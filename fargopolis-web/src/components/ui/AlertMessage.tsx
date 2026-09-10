import { Alert } from "@chakra-ui/react";
import React, { ReactNode } from "react";

type AlertStatus = "success" | "info" | "warning" | "error";

interface AlertMessageProps {
    message: string;
    severity?: AlertStatus | undefined;
    icon?: ReactNode;
}

export const AlertMessage: React.FC<AlertMessageProps> = ({ message, severity = "info", icon }) => {
    return (
        <Alert.Root status={severity} m="2" justifyContent="center">
            <Alert.Indicator>{icon}</Alert.Indicator>
            <Alert.Content>
                <Alert.Title>{message}</Alert.Title>
            </Alert.Content>
        </Alert.Root>
    );
};
