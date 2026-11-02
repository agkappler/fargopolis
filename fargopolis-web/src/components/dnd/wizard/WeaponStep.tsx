import { Box, chakra, Grid, Text } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { CharacterWizardValues, STARTING_WEAPONS } from "./wizardConfig";

interface WeaponStepProps {
    /** Key of the weapon already saved to the character, if any. */
    savedWeaponKey?: string;
}

export const WeaponStep: React.FC<WeaponStepProps> = ({ savedWeaponKey }) => {
    const { watch, setValue } = useFormContext<CharacterWizardValues>();
    const selected = watch("startingWeapon");

    const onSelect = (key: string) => {
        // A saved weapon can be swapped but not cleared from here.
        const next = key === selected && !savedWeaponKey ? "" : key;
        setValue("startingWeapon", next, { shouldDirty: true });
    };

    return (
        <Box mb={2}>
            <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap={3}>
                {STARTING_WEAPONS.map(w => {
                    const isSelected = w.key === selected;
                    return (
                        <chakra.button
                            key={w.key}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => onSelect(w.key)}
                            textAlign="left"
                            p="3"
                            borderRadius="md"
                            border="1px solid"
                            borderColor={isSelected ? "brand" : "border.strong"}
                            bg="bg.raised"
                            outline={isSelected ? "2px solid" : undefined}
                            outlineColor={isSelected ? "accent" : undefined}
                            outlineOffset="2px"
                            cursor="pointer"
                            transition="all 200ms"
                            _hover={{ borderColor: "accent" }}
                        >
                            <Text textStyle="display-title" fontSize="md" color="fg">{w.name}</Text>
                            <Text fontSize="xs" color="fg" mt="1">
                                {w.damage} {w.damageType} · {w.range}
                            </Text>
                            <Text fontSize="xs" color="fg.muted" mt="1">{w.description}</Text>
                        </chakra.button>
                    );
                })}
            </Grid>
            {savedWeaponKey && (
                <Text fontSize="xs" color="fg.muted" mt="3">
                    Already added to your character. Picking another replaces it.
                </Text>
            )}
        </Box>
    );
};
