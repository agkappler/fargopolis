import { ABILITY_KEYS, AbilityKey } from "@/constants/Skills";
import { abilityModifier, formatModifier } from "@/helpers/DndMath";
import { Box, Button, Flex, Grid, Text } from "@chakra-ui/react";
import { useFormContext, useWatch } from "react-hook-form";
import { NumberInput } from "../../inputs/NumberInput";
import { ABILITY_LABELS, CharacterWizardValues, STANDARD_ARRAY } from "./wizardConfig";

const ModifierHint: React.FC<{ ability: AbilityKey }> = ({ ability }) => {
    const value = useWatch<CharacterWizardValues>({ name: `abilityScores.${ability}` });
    const n = value === "" || value == null ? NaN : Number(value);
    if (!Number.isFinite(n)) return null;
    return (
        <Text textStyle="label" color="fg.muted" mt="1">
            Mod {formatModifier(abilityModifier(n))}
        </Text>
    );
};

export const AbilityScoresStep: React.FC = () => {
    const { setValue } = useFormContext<CharacterWizardValues>();

    const applyStandardArray = () => {
        ABILITY_KEYS.forEach((k, i) => {
            setValue(`abilityScores.${k}`, STANDARD_ARRAY[i], { shouldValidate: true, shouldDirty: true });
        });
    };

    return (
        <Box mb={2}>
            <Flex justify="space-between" align="center" mb="3" gap="2" wrap="wrap">
                <Text textStyle="label" color="fg.muted">Scores</Text>
                <Button type="button" variant="secondary" size="sm" onClick={applyStandardArray}>
                    Use Standard Array
                </Button>
            </Flex>
            <Grid templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }} gap={4}>
                {ABILITY_KEYS.map(k => (
                    <Box key={k}>
                        <NumberInput
                            label={ABILITY_LABELS[k]}
                            fieldName={`abilityScores.${k}`}
                            requiredMessage={`${ABILITY_LABELS[k]} is required`}
                            min={1}
                            max={30}
                        />
                        <ModifierHint ability={k} />
                    </Box>
                ))}
            </Grid>
        </Box>
    );
};
