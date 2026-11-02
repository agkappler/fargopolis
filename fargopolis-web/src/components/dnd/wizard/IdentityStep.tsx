import { Grid, GridItem } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { DropdownInput } from "../../inputs/DropdownInput";
import { NumberInput } from "../../inputs/NumberInput";
import { TextInput } from "../../inputs/TextInput";
import { useCharacterOptions } from "../useCharacterOptions";
import { CharacterWizardValues } from "./wizardConfig";

export const IdentityStep: React.FC = () => {
    const { watch, setValue } = useFormContext<CharacterWizardValues>();
    const { raceOptions, classOptions, subraceOptions, subclassOptions } = useCharacterOptions(
        watch("race"),
        watch("className"),
    );

    return (
        <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={2}>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <TextInput label="Name" fieldName="name" requiredMessage="Name is required" />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput label="Level" fieldName="level" requiredMessage="Level is required" min={1} max={20} />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput
                    label="Race"
                    fieldName="race"
                    options={raceOptions}
                    requiredMessage="Race is required"
                    onChange={() => setValue("subrace", "")}
                />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput
                    label="Class"
                    fieldName="className"
                    options={classOptions}
                    requiredMessage="Class is required"
                    onChange={() => setValue("subclassName", "")}
                />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput label="Subrace" fieldName="subrace" options={subraceOptions} />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput label="Subclass" fieldName="subclassName" options={subclassOptions} />
            </GridItem>
        </Grid>
    );
};
