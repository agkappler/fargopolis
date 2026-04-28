import { useAuth } from "@clerk/react";
import { Box, Button } from "@mui/material";
import { PropsWithChildren, useState } from "react";
import { DefaultValues, FieldValues, FormProvider, useForm } from "react-hook-form";
import { useAppContext } from "../AppContext";
import { ErrorMessage } from "../ui/ErrorMessage";

interface BasicFormProps<T> extends PropsWithChildren {
    errorMessage: string | undefined;
    onSubmit: (data: T) => Promise<void>;
    onDelete?: () => Promise<void>;
    defaultValues?: T;
    isClerkForm?: boolean;
}

export const BasicForm = <T extends FieldValues,>({
    children,
    defaultValues,
    errorMessage,
    onSubmit,
    onDelete,
    isClerkForm = false,
}: BasicFormProps<T>) => {
    const methods = useForm<T>({ defaultValues: defaultValues as DefaultValues<T> });
    const { isAuthenticated } = useAppContext();
    const { isLoaded, isSignedIn } = useAuth();
    /** Clerk-only gate for serverless mutations; legacy session auth when `isClerkForm` is false. */
    const canWrite = isClerkForm ? isLoaded && isSignedIn : isAuthenticated;
    const [isLoading, setIsLoading] = useState(false);
    const awaitSubmit = async (data: T) => {
        setIsLoading(true);
        await onSubmit(data);
        setIsLoading(false);
    };

    const awaitDelete = async () => {
        if (onDelete) {
            setIsLoading(true);
            await onDelete();
            setIsLoading(false);
        }
    };

    return (<Box paddingY={1}>
        <ErrorMessage errorMessage={errorMessage} />
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(awaitSubmit)}>
                {children}
                {canWrite && (
                    <Box className={`flex py-2 ${onDelete === undefined ? 'justify-center' : 'justify-between'}`}>
                        {onDelete !== undefined && <Button type="button" variant="outlined" color="secondary" loading={isLoading} onClick={awaitDelete}>Delete</Button>}
                        <Button type="submit" variant="contained" color="primary" loading={isLoading}>Submit</Button>
                    </Box>
                )}
            </form>
        </FormProvider>
    </Box>);
}