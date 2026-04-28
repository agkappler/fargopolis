import { PropsWithChildren } from "react";
import { SWRConfig } from "swr";

export const SwrConfigWrapper: React.FC<PropsWithChildren> = ({ children }) => {
    return <SWRConfig value={{
        onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
            if (retryCount >= 1) return;
            setTimeout(() => revalidate({ retryCount }), 5000);
        }
    }}>
        {children}
    </SWRConfig>
}