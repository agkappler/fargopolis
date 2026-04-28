import RequestManager from "@/helpers/RequestManager";
import { Show, SignIn, UserButton } from "@clerk/react";
import { Box, Button, Grid, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { getErrorMessage } from "@/helpers/Errors";
import { successToast } from "@/helpers/Toasts";
import { useAppContext } from "./AppContext";
import { BasicForm } from "./inputs/BasicForm";
import { TextInput } from "./inputs/TextInput";
import { ErrorMessage } from "./ui/ErrorMessage";
import { SimpleDialog } from "./ui/SimpleDialog";
import { AlertMessage } from "./ui/AlertMessage";

interface LoginFormInputs {
    username: string;
    password: string;
}

interface LoginFormProps {
    onLogin?: () => void;
}

type AuthMode = "legacy" | "clerk";

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [authMode, setAuthMode] = useState<AuthMode>("legacy");

    const { setUser, isAuthenticated } = useAppContext();
    const [userErrorMessage, setUserErrorMessage] = useState<string | undefined>();
    const [isOpen, setIsOpen] = useState(false);
    const onClose = () => setIsOpen(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();

    const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
        try {
            const response = await RequestManager.authenticateUser(data.username, data.password);
            setErrorMessage(undefined);
            successToast('Succesfully logged in!');
            setUser(response.user);
            onLogin?.();
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
        }
    };

    const logout = async () => {
        try {
            await RequestManager.logout();
            setErrorMessage(undefined);
            successToast('Succesfully logged out!');
            setUser(undefined);
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
        }
    }

    const createUser = async (data: { username: string, password: string }) => {
        try {
            await RequestManager.post("/users/createUser", data);
            setUserErrorMessage(undefined);
            successToast('Succesfully created user!');
        } catch (error: unknown) {
            setUserErrorMessage(getErrorMessage(error));
        }
    }

    const showLegacy = authMode === "legacy";

    return (<>
        <Box
            component={showLegacy ? "form" : "div"}
            {...(showLegacy ? { onSubmit: handleSubmit(onSubmit) } : {})}
            sx={{ maxWidth: 480, mx: "auto", mt: 4, p: 3, border: "1px solid #ccc", borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
            <Typography variant="h5" textAlign="center" mb={2}>
                Login
            </Typography>
            <ToggleButtonGroup
                exclusive
                value={authMode}
                onChange={(_, v: AuthMode | null) => v && setAuthMode(v)}
                size="small"
                sx={{ mb: 2 }}
            >
                <ToggleButton value="legacy">Site</ToggleButton>
                <ToggleButton value="clerk">Clerk</ToggleButton>
            </ToggleButtonGroup>
            <AlertMessage message="Authentication is only required for write actions, so feel free to take a look around!" />
            {showLegacy ? (
                <>
                    <TextField
                        fullWidth
                        label="Username"
                        {...register("username", { required: "Username is required" })}
                        error={!!errors.username}
                        helperText={errors.username?.message}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        {...register("password", { required: "Password is required" })}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        margin="normal"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        Login
                    </Button>
                    <ErrorMessage errorMessage={errorMessage} />
                    {isAuthenticated && <Box display="flex" justifyContent="space-between" marginTop={2} width="100%">
                        <Button onClick={logout}>Logout</Button>
                        <Button onClick={() => setIsOpen(true)}>Create User</Button>
                    </Box>}
                </>
            ) : (
                <>
                    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                        <Show when="signed-out">
                            <SignIn routing="hash" withSignUp={false} />
                        </Show>
                        <Show when="signed-in">
                            <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={1}>
                                <Typography variant="body2" textAlign="center">
                                    Signed in with Clerk. You can post bounties on the Bounty Board.
                                </Typography>
                                <UserButton />
                            </Box>
                        </Show>
                    </Box>
                </>
            )}

        </Box>
        <SimpleDialog title="Create User" isOpen={isOpen} onClose={onClose}>
            <BasicForm
                errorMessage={userErrorMessage}
                onSubmit={createUser}
            >
                <Grid container spacing={2}>
                    <Grid size={12}>
                        <TextInput
                            label="Email"
                            fieldName="email"
                        />
                    </Grid>
                    <Grid size={12}>
                        <TextInput
                            label="Password"
                            fieldName="password"
                        />
                    </Grid>
                </Grid>
            </BasicForm>
        </SimpleDialog>
    </>);
};