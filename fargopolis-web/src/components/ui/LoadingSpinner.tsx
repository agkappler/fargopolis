import React from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";

interface LoadingSpinnerProps {
    size?: number;
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, message }) => {
    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" margin={2}>
            <Spinner boxSize={`${size}px`} borderWidth="3px" color="brand.DEFAULT" />
            {message && <Box mt={2}><Text fontSize="sm">{message}</Text></Box>}
        </Box>
    );
};
