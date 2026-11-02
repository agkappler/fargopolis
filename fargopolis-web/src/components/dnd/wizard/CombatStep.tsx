import { ABILITY_KEYS, SKILLS } from "@/constants/Skills";
import { Box, Grid, GridItem, Text } from "@chakra-ui/react";
import { DropdownInput } from "../../inputs/DropdownInput";
import { NumberInput } from "../../inputs/NumberInput";
import { ABILITY_LABELS } from "./wizardConfig";

const SAVING_THROW_OPTIONS = ABILITY_KEYS.map(k => ({ value: k, label: ABILITY_LABELS[k] }));
const SKILL_OPTIONS = SKILLS.map(s => ({ value: s.key, label: `${s.name} (${s.ability.toUpperCase()})` }));

export const CombatStep: React.FC = () => (
    <Box mb={2}>
        <Text textStyle="label" color="fg.muted" mb="3">Combat</Text>
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={5}>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Max HP" fieldName="hitPoints.max" requiredMessage="Max HP is required" min={1} max={999} />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Armor Class" fieldName="armorClass" requiredMessage="Armor Class is required" min={0} max={50} />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput
                    label="Initiative Bonus"
                    fieldName="initiativeBonus"
                    requiredMessage="Initiative bonus is required"
                    allowNegative
                    min={-10}
                    max={20}
                />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Speed (ft)" fieldName="speed" requiredMessage="Speed is required" min={0} max={200} />
            </GridItem>
        </Grid>
        <Text textStyle="label" color="fg.muted" mb="3">Proficiencies</Text>
        <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput label="Saving Throws" fieldName="savingThrowProficiencies" options={SAVING_THROW_OPTIONS} isMultiSelect />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput label="Skills" fieldName="skillProficiencies" options={SKILL_OPTIONS} isMultiSelect />
            </GridItem>
        </Grid>
    </Box>
);
