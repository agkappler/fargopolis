import { keypadInput } from "@/helpers/HitPoints";
import { Box, Button, Grid, Text } from "@chakra-ui/react";
import { KeyboardEvent, useState } from "react";

export type HpKeypadMode = "damage" | "heal" | "temp";

interface HpKeypadProps {
    onApply: (mode: HpKeypadMode, amount: number) => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"] as const;
const KEY_LABELS: Partial<Record<(typeof KEYS)[number], string>> = { C: "Clear", "⌫": "Backspace" };

const keyProps = {
    variant: "outline",
    h: "11",
    fontFamily: "mono",
    fontSize: "md",
    borderColor: "border",
    color: "fg",
    bg: "bg.raised",
    _hover: { bg: "ember.100", borderColor: "ember.500" },
} as const;

/** Damage / heal / temp keypad shown in the HP popover. Up to 3 digits. */
export const HpKeypad: React.FC<HpKeypadProps> = ({ onApply }) => {
    const [display, setDisplay] = useState("");
    const amount = Number(display || "0");

    const apply = (mode: HpKeypadMode) => {
        if (amount <= 0) return;
        onApply(mode, amount);
        setDisplay("");
    };

    // Physical keyboard while focused: digits, Backspace, and Enter (= Damage).
    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (/^\d$/.test(e.key)) setDisplay(d => keypadInput(d, e.key));
        else if (e.key === "Backspace") setDisplay(d => keypadInput(d, "⌫"));
        else if (e.key === "Enter" && amount > 0) {
            e.preventDefault();
            apply("damage");
        } else return;
        e.preventDefault();
    };

    return (
        <Box w="232px" maxW="full" onKeyDown={onKeyDown}>
            <Text
                aria-live="polite"
                data-testid="hp-keypad-display"
                fontFamily="mono"
                fontSize="2xl"
                lineHeight="1.2"
                textAlign="right"
                bg="bg.sunk"
                borderRadius="md"
                px="3"
                py="1.5"
                mb="2"
                color={display ? "fg" : "fg.subtle"}
            >
                {display || "0"}
            </Text>
            <Grid templateColumns="repeat(3, 1fr)" gap="1.5" mb="2">
                {KEYS.map(k => (
                    <Button
                        key={k}
                        {...keyProps}
                        aria-label={KEY_LABELS[k] ?? k}
                        onClick={() => setDisplay(d => keypadInput(d, k))}
                    >
                        {k}
                    </Button>
                ))}
            </Grid>
            <Grid templateColumns="repeat(3, 1fr)" gap="1.5">
                <Button
                    size="sm"
                    disabled={amount <= 0}
                    onClick={() => apply("damage")}
                    bg="garnet.100"
                    color="garnet.700"
                    borderWidth="1px"
                    borderStyle="solid"
                    borderColor="garnet.500"
                    _hover={{ bg: "garnet.500", color: "parchment.0" }}
                >
                    Damage
                </Button>
                <Button size="sm" variant="primary" px="2" disabled={amount <= 0} onClick={() => apply("heal")}>
                    Heal
                </Button>
                <Button
                    size="sm"
                    disabled={amount <= 0}
                    onClick={() => apply("temp")}
                    bg="bg.raised"
                    color="slate.700"
                    borderWidth="1px"
                    borderStyle="solid"
                    borderColor="slate.300"
                    _hover={{ bg: "slate.300", color: "parchment.0" }}
                >
                    Temp
                </Button>
            </Grid>
        </Box>
    );
};
