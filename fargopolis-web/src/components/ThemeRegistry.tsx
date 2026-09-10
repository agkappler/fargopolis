import { ChakraProvider } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { chakraSystem } from "@/chakra-theme";

export const ThemeRegistry: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <ChakraProvider value={chakraSystem}>
            {children}
        </ChakraProvider>
    );
};
