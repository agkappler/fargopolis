import { IconButton } from "@chakra-ui/react";

interface HpButtonProps {
    label: string;
    symbol: string;
    disabled: boolean;
    onClick: () => void;
    /** Square size token (default "5"); the Play-page steppers use "11" for a 44px tap target. */
    boxSize?: string;
    title?: string;
}

export const HpButton: React.FC<HpButtonProps> = ({ label, symbol, disabled, onClick, boxSize = "5", title }) => (
    <IconButton
        aria-label={label}
        title={title}
        size="xs"
        minW={boxSize}
        w={boxSize}
        h={boxSize}
        fontSize={boxSize === "5" ? undefined : "lg"}
        variant="outline"
        borderRadius="full"
        borderColor="pine.500"
        color="pine.700"
        _hover={{ borderColor: "ember.500", color: "ember.700" }}
        disabled={disabled}
        onClick={onClick}
    >
        {symbol}
    </IconButton>
);
