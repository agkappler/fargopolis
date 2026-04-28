import { Show, SignIn, UserButton, useAuth } from "@clerk/react";
import { Box, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { AlertMessage } from "./ui/AlertMessage";

interface LoginFormProps {
    onLogin?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const { isLoaded, isSignedIn } = useAuth();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            onLogin?.();
        }
    }, [isLoaded, isSignedIn, onLogin]);

    return (<>
        <Box
            component="div"
            sx={{ maxWidth: 480, mx: "auto", mt: 4, p: 3, border: "1px solid #ccc", borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
            <Typography variant="h5" textAlign="center" mb={2}>
                Sign In
            </Typography>
            <AlertMessage message="Authentication is only required for write actions, so feel free to take a look around!" />
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <Show when="signed-out">
                    <SignIn routing="hash" withSignUp={false} />
                </Show>
                <Show when="signed-in">
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={1}>
                        <Typography variant="body2" textAlign="center">
                            Signed in with Clerk.
                        </Typography>
                        <UserButton />
                    </Box>
                </Show>
            </Box>

        </Box>
    </>);
};