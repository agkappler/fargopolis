import { ABILITY_KEYS, SKILLS } from "@/constants/Skills";
import type { AbilityKey } from "@/constants/Skills";
import { Box, Grid, GridItem, Text } from "@chakra-ui/react";
import { DropdownInput } from "../inputs/DropdownInput";
import { NumberInput } from "../inputs/NumberInput";

const ABILITY_LABELS: Record<AbilityKey, string> = {
    str: "STR",
    dex: "DEX",
    con: "CON",
    int: "INT",
    wis: "WIS",
    cha: "CHA",
};

const SAVING_THROW_OPTIONS = ABILITY_KEYS.map(k => ({ value: k, label: ABILITY_LABELS[k] }));
const SKILL_OPTIONS = SKILLS.map(s => ({ value: s.key, label: `${s.name} (${s.ability.toUpperCase()})` }));

/** Stat-block inputs for the Edit Character dialog. All optional, so a character with no stats can still be saved. */
export const CharacterStatFields: React.FC = () => (
    <Box>
        <Text textStyle="label" color="fg.muted" mb="3">Ability Scores</Text>
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={5}>
            {ABILITY_KEYS.map(k => (
                <GridItem key={k} colSpan={{ base: 6, sm: 4 }}>
                    <NumberInput label={ABILITY_LABELS[k]} fieldName={`abilityScores.${k}`} min={1} max={30} />
                </GridItem>
            ))}
        </Grid>
        <Text textStyle="label" color="fg.muted" mb="3">Combat</Text>
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={5}>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Current HP" fieldName="hitPoints.current" min={0} max={999} />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Max HP" fieldName="hitPoints.max" min={1} max={999} />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Temp HP" fieldName="hitPoints.temp" min={0} max={999} />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Armor Class" fieldName="armorClass" min={0} max={50} />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Initiative Bonus" fieldName="initiativeBonus" allowNegative min={-10} max={20} />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Speed (ft)" fieldName="speed" min={0} max={200} />
            </GridItem>
        </Grid>
        <Text textStyle="label" color="fg.muted" mb="3">Proficiencies</Text>
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={0}>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput label="Saving Throws" fieldName="savingThrowProficiencies" options={SAVING_THROW_OPTIONS} isMultiSelect />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput label="Skills" fieldName="skillProficiencies" options={SKILL_OPTIONS} isMultiSelect />
            </GridItem>
        </Grid>
    </Box>
);
