import { PropsWithChildren } from "react";
import { ErrorMessage } from "./ErrorMessage";

interface ErrorWrapperProps extends PropsWithChildren {
    error: Error | undefined;
    errorMessage?: string;
}

export const ErrorWrapper: React.FC<ErrorWrapperProps> = ({ error, errorMessage, children }) => {
    return error
        ? <ErrorMessage errorMessage={error.message ?? errorMessage} />
        : <>{children}</>;
}
