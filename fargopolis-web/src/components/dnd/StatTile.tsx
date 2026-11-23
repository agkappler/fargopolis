import { chakra, Flex, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
import { rollButtonProps } from "./rollStyle";

const tileProps = {
    display: "flex",
    flexDir: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1",
    minH: "16",
    py: "2",
    px: "1",
    borderRadius: "md",
    minW: "0",
} as const;

const TileValue: React.FC<{ children: ReactNode }> = ({ children }) => (
    <Text as="span" fontFamily="mono" fontSize="24px" lineHeight="1">{children}</Text>
);
const TileLabel: React.FC<{ children: ReactNode }> = ({ children }) => (
    <Text as="span" textStyle="label" color="fg.muted" textAlign="center">{children}</Text>
);

interface StatTileProps {
    value: ReactNode;
    label: string;
}

/** A static stat tile (big mono value over a mono label), e.g. AC or Speed. */
export const StatTile: React.FC<StatTileProps> = ({ value, label }) => (
    <Flex {...tileProps} bg="bg.sunk">
        <TileValue>{value}</TileValue>
        <TileLabel>{label}</TileLabel>
    </Flex>
);

interface RollStatTileProps extends StatTileProps {
    ariaLabel: string;
    onClick: () => void;
}

/** A stat tile that is also a roll button (e.g. Initiative). */
export const RollStatTile: React.FC<RollStatTileProps> = ({ value, label, ariaLabel, onClick }) => (
    <chakra.button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        {...rollButtonProps}
        {...tileProps}
    >
        <TileValue>{value}</TileValue>
        <TileLabel>{label}</TileLabel>
    </chakra.button>
);
