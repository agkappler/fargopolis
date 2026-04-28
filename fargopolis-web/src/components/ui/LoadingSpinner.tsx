import React from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

interface LoadingSpinnerProps {
    size?: number;
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, message }) => {
    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" margin={2}>
            <CircularProgress size={size} />
            {message && <Box mt={2}><Typography variant="body2">{message}</Typography></Box>}
        </Box>
    );
};