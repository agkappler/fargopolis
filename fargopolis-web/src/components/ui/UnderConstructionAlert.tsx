import ConstructionIcon from "@mui/icons-material/Construction";
import { Alert } from "@mui/material";
import React from "react";

export const UnderConstructionAlert: React.FC = () => {
    return (<>
        <Alert
            severity="warning"
            icon={<ConstructionIcon />}
            title="Under Construction"
            color="warning"
            variant="standard"
            sx={{ fontWeight: "bold", margin: 2 }}
        >
            Under Construction
        </Alert>
    </>);
};