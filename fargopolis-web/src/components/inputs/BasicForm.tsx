import { useAuth } from "@clerk/react";
import { Box, Button, Flex } from "@chakra-ui/react";
import { PropsWithChildren, useState } from "react";
import { DefaultValues, FieldValues, FormProvider, useForm } from "react-hook-form";
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
    isClerkForm,
}: BasicFormProps<T>) => {
    const methods = useForm<T>({ defaultValues: defaultValues as DefaultValues<T> });
    const { isLoaded, isSignedIn } = useAuth();
    void isClerkForm;
    const canWrite = isLoaded && isSignedIn;
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

    return (<Box py="1">
        <ErrorMessage errorMessage={errorMessage} />
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(awaitSubmit)}>
                {children}
                {canWrite && (
                    <Flex py="2" justify={onDelete === undefined ? "center" : "space-between"}>
                        {onDelete !== undefined && (
                            <Button type="button" variant="secondary" loading={isLoading} onClick={awaitDelete}>
                                Delete
                            </Button>
                        )}
                        <Button type="submit" variant="primary" loading={isLoading}>Submit</Button>
                    </Flex>
                )}
            </form>
        </FormProvider>
    </Box>);
}
