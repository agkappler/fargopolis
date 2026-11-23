import { Box, Grid, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

const pillProps = {
    as: "span",
    display: "inline-block",
    textStyle: "label",
    borderRadius: "full",
    borderWidth: "1px",
    borderStyle: "solid",
    px: "2",
    py: "0.5",
    whiteSpace: "nowrap",
} as const;

/** "Lvl N" pill for class features. */
export const LevelPill: React.FC<{ level: number }> = ({ level }) => (
    <Text {...pillProps} bg="pine.100" color="pine.700" borderColor="pine.300">Lvl {level}</Text>
);

/** "Race" pill for racial traits. */
export const RacePill: React.FC = () => (
    <Text {...pillProps} bg="stone.50" color="slate.700" borderColor="slate.300">Race</Text>
);

interface FeatureRowProps {
    /** Level/Race pill. Sits in its own left column on wider screens, above the name on phones. */
    pill?: ReactNode;
    name: string;
    /** Description and any extra content, shown under the name. */
    children?: ReactNode;
    /** Right-side action, e.g. the "+ Ability" button. */
    action?: ReactNode;
}

/** Left-aligned feature/trait row: pill · bold name with description · action. */
export const FeatureRow: React.FC<FeatureRowProps> = ({ pill, name, children, action }) => (
    <Grid
        templateColumns={{ base: "1fr auto", sm: "4.5rem 1fr auto" }}
        columnGap="3"
        rowGap="1"
        alignItems="start"
        py="3"
        borderTopWidth="1px"
        borderColor="border"
        textAlign="left"
    >
        <Box gridColumn={{ base: "1 / -1", sm: "auto" }} pt={{ base: "0", sm: "0.5" }}>{pill}</Box>
        <Box minW="0">
            <Text fontWeight="600">{name}</Text>
            <Box maxW="68ch" color="fg.secondary" fontSize="sm" textAlign="left" mt="1">
                {children}
            </Box>
        </Box>
        <Box>{action}</Box>
    </Grid>
);
