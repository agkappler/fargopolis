import { Show, SignIn, UserButton, useAuth } from "@clerk/react";
import { Box, Heading, Text } from "@chakra-ui/react";
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

    return (
        <Box
            maxW="480px"
            mx="auto"
            mt="4"
            p="3"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="border.strong"
            borderRadius="lg"
            display="flex"
            flexDirection="column"
            alignItems="center"
        >
            <Heading size="lg" textAlign="center" mb="2">
                Sign In
            </Heading>
            <AlertMessage message="Authentication is only required for write actions, so feel free to take a look around!" />
            <Box width="100%" display="flex" justifyContent="center">
                <Show when="signed-out">
                    <SignIn routing="hash" withSignUp={false} />
                </Show>
                <Show when="signed-in">
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={1}>
                        <Text fontSize="sm" textAlign="center">
                            Signed in with Clerk.
                        </Text>
                        <UserButton />
                    </Box>
                </Show>
            </Box>
        </Box>
    );
};
