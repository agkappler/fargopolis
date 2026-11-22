import { IconButton } from "@chakra-ui/react";

interface HpButtonProps {
    label: string;
    symbol: string;
    disabled: boolean;
    onClick: () => void;
}

export const HpButton: React.FC<HpButtonProps> = ({ label, symbol, disabled, onClick }) => (
    <IconButton
        aria-label={label}
        size="xs"
        minW="5"
        w="5"
        h="5"
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
