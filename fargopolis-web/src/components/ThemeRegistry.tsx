import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "@mui/material";
import { PropsWithChildren } from "react";
import { chakraSystem } from "@/chakra-theme";
import muiTheme from "@/theme";

export const ThemeRegistry: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <ChakraProvider value={chakraSystem}>
            <ThemeProvider theme={muiTheme}>
                {children}
            </ThemeProvider>
        </ChakraProvider>
    );
};
