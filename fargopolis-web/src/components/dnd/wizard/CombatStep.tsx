import { ABILITY_KEYS, SKILLS, SkillKey } from "@/constants/Skills";
import { Box, Grid, GridItem, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { DropdownInput } from "../../inputs/DropdownInput";
import { NumberInput } from "../../inputs/NumberInput";
import { useCharacterOptions } from "../useCharacterOptions";
import { useClassProficiencies } from "./useClassProficiencies";
import { useRaceSpeed } from "./useRaceSpeed";
import { ABILITY_LABELS, CharacterWizardValues } from "./wizardConfig";

const SAVING_THROW_OPTIONS = ABILITY_KEYS.map(k => ({ value: k, label: ABILITY_LABELS[k] }));

export const CombatStep: React.FC = () => {
    const { watch, setValue } = useFormContext<CharacterWizardValues>();
    const race = watch("race");
    const className = watch("className");
    const { isCustomRace, classOptions } = useCharacterOptions(race, className);
    const speed = useRaceSpeed(race, isCustomRace);
    const { savingThrows, skillOptions, skillChooseCount } = useClassProficiencies(className);

    const skillOptionList = skillOptions.map(key => {
        const skill = SKILLS.find(s => s.key === key);
        return { value: key, label: skill ? `${skill.name} (${skill.ability.toUpperCase()})` : key };
    });

    // Prefill once each value resolves for the race/class actually selected. Tracking what's
    // already applied (rather than just "did the field change") means a slow-loading fetch
    // still lands instead of being silently missed by a ref that updated too early.
    const appliedRaceRef = useRef<string>();
    useEffect(() => {
        if (speed !== undefined && appliedRaceRef.current !== race) {
            appliedRaceRef.current = race;
            setValue("speed", speed, { shouldDirty: true });
        }
    }, [race, speed, setValue]);

    const appliedClassRef = useRef<string>();
    useEffect(() => {
        if (savingThrows !== undefined && appliedClassRef.current !== className) {
            appliedClassRef.current = className;
            setValue("savingThrowProficiencies", savingThrows, { shouldDirty: true });
            // A previously-chosen skill may no longer be on the new class's list.
            const current = watch("skillProficiencies") ?? [];
            setValue("skillProficiencies", current.filter((k: SkillKey) => skillOptions.includes(k)), { shouldDirty: true });
        }
    }, [className, savingThrows, skillOptions, setValue, watch]);

    const classLabel = classOptions.find(o => o.value === className)?.label ?? className;
    const skillsInfo = className
        ? `Scoped to ${classLabel}'s skill list${skillChooseCount ? ` — choose ${skillChooseCount}` : ""}.`
        : "Pick a class first to scope this to its skill list.";

    return (
        <Box mb={2}>
            <Text textStyle="label" color="fg.muted" mb="3">Combat</Text>
            <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={5}>
                <GridItem colSpan={{ base: 12, sm: 6 }}>
                    <NumberInput
                        label="Max HP"
                        fieldName="hitPoints.max"
                        requiredMessage="Max HP is required"
                        min={1}
                        max={999}
                        info="Level 1: your class's hit die (max roll) + CON modifier. Each level after: the die's average (or a roll) + CON modifier."
                    />
                </GridItem>
                <GridItem colSpan={{ base: 12, sm: 6 }}>
                    <NumberInput
                        label="Armor Class"
                        fieldName="armorClass"
                        requiredMessage="Armor Class is required"
                        min={0}
                        max={50}
                        info="10 + DEX modifier, plus any armor or shield bonus you're wearing."
                    />
                </GridItem>
                <GridItem colSpan={{ base: 12, sm: 6 }}>
                    <NumberInput
                        label="Initiative Bonus"
                        fieldName="initiativeBonus"
                        requiredMessage="Initiative bonus is required"
                        allowNegative
                        min={-10}
                        max={20}
                        info="Equal to your DEX modifier, unless a feat or feature adds more."
                    />
                </GridItem>
                <GridItem colSpan={{ base: 12, sm: 6 }}>
                    <NumberInput
                        label="Speed (ft)"
                        fieldName="speed"
                        requiredMessage="Speed is required"
                        min={0}
                        max={200}
                        info="Set by race. Prefilled once you pick a race in Identity — override it for armor, terrain, or a race feature that changes it."
                    />
                </GridItem>
            </Grid>
            <Text textStyle="label" color="fg.muted" mb="3">Proficiencies</Text>
            <Grid templateColumns="repeat(12, 1fr)" gap={4}>
                <GridItem colSpan={{ base: 12, sm: 6 }}>
                    <DropdownInput
                        label="Saving Throws"
                        fieldName="savingThrowProficiencies"
                        options={SAVING_THROW_OPTIONS}
                        isMultiSelect
                        info="Prefilled from your class's proficient saves. Edit it if a feat or feature grants another."
                    />
                </GridItem>
                <GridItem colSpan={{ base: 12, sm: 6 }}>
                    <DropdownInput
                        label="Skills"
                        fieldName="skillProficiencies"
                        options={skillOptionList}
                        isMultiSelect
                        info={skillsInfo}
                    />
                </GridItem>
            </Grid>
        </Box>
    );
};
