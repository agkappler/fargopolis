import { Condition, CONDITIONS } from "@/constants/Conditions";
import { Button, chakra, Grid, Popover, Portal } from "@chakra-ui/react";
import { ShieldAlert } from "lucide-react";

interface ConditionsPopoverProps {
    active: Condition[];
    onToggle: (c: Condition) => void;
}

/** Header "Conditions" button with a popover of the 12 conditions. Session-only state — persistence is issue #43. */
export const ConditionsPopover: React.FC<ConditionsPopoverProps> = ({ active, onToggle }) => (
    <Popover.Root positioning={{ placement: "bottom-end" }} lazyMount>
        <Popover.Trigger asChild>
            <Button variant="outline" size="md" minH="10">
                <ShieldAlert size={16} aria-hidden="true" />
                Conditions{active.length > 0 ? ` (${active.length})` : ""}
            </Button>
        </Popover.Trigger>
        <Portal>
            <Popover.Positioner>
                <Popover.Content w="auto" maxW="calc(100vw - 16px)">
                    <Popover.Arrow />
                    <Popover.Body p="3">
                        <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="1.5" aria-label="Conditions">
                            {CONDITIONS.map(c => {
                                const on = active.includes(c);
                                return (
                                    <chakra.button
                                        key={c}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => onToggle(c)}
                                        px="3"
                                        minH="8"
                                        fontSize="xs"
                                        textAlign="left"
                                        borderRadius="full"
                                        borderWidth="1px"
                                        borderStyle="solid"
                                        cursor="pointer"
                                        transition="all 120ms"
                                        bg={on ? "slate.700" : "bg.raised"}
                                        color={on ? "parchment.0" : "fg.secondary"}
                                        borderColor={on ? "slate.700" : "border"}
                                        _hover={on ? undefined : { borderColor: "ember.500", color: "ember.700" }}
                                        _focusVisible={{ outline: "2px solid", outlineColor: "ember.500", outlineOffset: "2px" }}
                                    >
                                        {c}
                                    </chakra.button>
                                );
                            })}
                        </Grid>
                    </Popover.Body>
                </Popover.Content>
            </Popover.Positioner>
        </Portal>
    </Popover.Root>
);
