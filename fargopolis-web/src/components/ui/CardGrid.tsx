import { Grid } from "@chakra-ui/react";
import { type PropsWithChildren } from "react";

/** Wrapping grid of model cards (quests, rewards, etc.); more, narrower columns on small screens. */
export const CardGrid: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <Grid
            templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }}
            gap={{ base: "2", md: "4" }}
            px="4"
            py={{ base: "3", md: "6" }}
            maxW="fp.container"
            mx="auto"
        >
            {children}
        </Grid>
    );
};
