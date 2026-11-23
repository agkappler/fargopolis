import { formatModifier } from "@/helpers/DndMath";
import { Box, chakra } from "@chakra-ui/react";
import { useRoller } from "./rolls/rollContext";
import { rollButtonProps } from "./rollStyle";

interface RollCellProps {
    /** Toast label, e.g. "Strength check". */
    label: string;
    modifier: number;
    /** Accessible name, including the modifier, e.g. "Roll Strength check, +1". */
    ariaLabel: string;
    /** Shows a small dot inside the pill and slightly bolder/darker text. */
    proficient?: boolean;
    /** Minimum pill width (default "14"); pass "0" to let a tight grid shrink it. */
    minW?: string;
    w?: string;
    /** Horizontal padding (default "2"). */
    px?: string;
}

/** The shared roll pill: a mono modifier button that rolls 1d20 + modifier and toasts the result. */
export const RollCell: React.FC<RollCellProps> = ({ label, modifier, ariaLabel, proficient = false, minW = "14", w, px = "2" }) => {
    const { rollD20 } = useRoller();
    return (
        <chakra.button
            type="button"
            aria-label={ariaLabel}
            onClick={() => rollD20(label, modifier)}
            {...rollButtonProps}
            fontFamily="mono"
            fontSize="xs"
            minH="30px"
            minW={minW}
            w={w}
            px={px}
            borderRadius="full"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            gap="1"
            fontWeight={proficient ? "600" : "400"}
            color={proficient ? "pine.900" : "pine.700"}
        >
            {proficient && (
                <Box as="span" w="6px" h="6px" borderRadius="full" bg="currentColor" flexShrink="0" aria-hidden="true" />
            )}
            {formatModifier(modifier)}
        </chakra.button>
    );
};
