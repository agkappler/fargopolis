import { Box } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingWrapperProps extends PropsWithChildren {
    isLoading: boolean;
    size?: number;
    message?: string;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({ isLoading, size, message, children }) => {
    return isLoading
        ? <Box justifyContent="center" width="100%">
            <LoadingSpinner size={size} message={message} />
        </Box>
        : <>{children}</>;
}