import { ThemeProvider } from "@mui/material";
import { PropsWithChildren } from "react";
import theme from "@/theme";

export const ThemeRegistry: React.FC<PropsWithChildren> = ({ children }) => {
    return <ThemeProvider theme={theme}>
        {children}
    </ThemeProvider>
}
