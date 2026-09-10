import { Alert } from "@chakra-ui/react";

interface ErrorMessageProps {
    errorMessage: string | undefined;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ errorMessage }) => {
    return <>{errorMessage !== undefined && <Alert.Root status="error" variant="outline" className="mb-2">
        <Alert.Indicator />
        <Alert.Content>
            <Alert.Title>{errorMessage}</Alert.Title>
        </Alert.Content>
    </Alert.Root>}
    </>
}
