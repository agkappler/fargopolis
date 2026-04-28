import { Alert, AlertColor } from "@mui/material";
import React, { ReactNode } from "react";

interface AlertMessageProps {
    message: string;
    severity?: AlertColor | undefined;
    icon?: ReactNode;
}

export const AlertMessage: React.FC<AlertMessageProps> = ({ message, severity = "info", icon }) => {
    return (<>
        <Alert
            severity={severity}
            icon={icon}
            variant="standard"
            sx={{ margin: 2, display: "flex", justifyContent: "center" }}
        >
            {message}
        </Alert>
    </>);
};