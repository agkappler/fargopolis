import { rollD20, rollMessage } from "@/helpers/Dice";
import { formatModifier } from "@/helpers/DndMath";
import { rollToast } from "@/helpers/Toasts";
import { Text } from "@chakra-ui/react";

interface RollCellProps {
    label: string;
    modifier: number;
    color?: string;
}

/** A single right-aligned modifier cell (used in the Ability Scores Mod/Save columns) that rolls 1d20+modifier on click. */
export const RollCell: React.FC<RollCellProps> = ({ label, modifier, color }) => {
    const handleRoll = () => {
        const { roll, total } = rollD20(modifier);
        rollToast(rollMessage(label, modifier, roll, total));
    };

    return (
        <Text
            as="button"
            onClick={handleRoll}
            fontFamily="mono"
            color={color}
            w="9"
            textAlign="right"
            bg="transparent"
            border="none"
            cursor="pointer"
            _hover={{ color: "accent.hover" }}
        >
            {formatModifier(modifier)}
        </Text>
    );
};
