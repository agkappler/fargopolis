import { getSubclasses, getSubraces } from "@/api/dnd5eapi";
import { FileRole } from "@/constants/FileRole";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import FileMetadata from "@/models/FileMetadata";
import Subclass from "@/models/Subclass";
import { Grid, GridItem } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import useSWR from "swr";
import { DropdownInput } from "../inputs/DropdownInput";
import { FileUpload } from "../inputs/FileUpload";
import { NumberInput } from "../inputs/NumberInput";
import { TextInput } from "../inputs/TextInput";

interface CharacterFormFieldsProps {
    character?: Character;
    isEdit: boolean;
    onUpload: (fileMetadata: FileMetadata) => Promise<void>;
    raceOptions: { value: string; label: string; }[];
    classOptions: { value: string; label: string; }[];
}

export const CharacterFormFields: React.FC<CharacterFormFieldsProps> = ({
    character,
    isEdit,
    onUpload,
    raceOptions,
    classOptions
}) => {
    const { watch } = useFormContext();
    const selectedClass = watch("className");
    const selectedRace = watch("race");

    // Dynamic subclass and subrace options based on selected class and race
    const { data: subclassData } = useSWR(
        selectedClass ? `/classes/${selectedClass}/subclasses` : null,
        () => getSubclasses(selectedClass)
    );
    const { data: subraceData } = useSWR(
        selectedRace ? `/races/${selectedRace}/subraces` : null,
        () => getSubraces(selectedRace)
    );

    // Get custom subclasses for the selected class
    const { data: customSubclassesForClass } = useSWR<Subclass[]>(
        selectedClass ? [`/gateway/subclasses/class`, selectedClass] as const : null,
        () => RequestManager.get<Subclass[]>(`/subclasses/class/${selectedClass}`),
    );

    const allSubclasses = [...(subclassData?.results ?? []), ...(customSubclassesForClass ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    const allSubraces = subraceData?.results ?? [];

    const dynamicSubclassOptions = allSubclasses.map(o => ({ value: o.index, label: o.name }));
    const dynamicSubraceOptions = allSubraces.map(o => ({ value: o.index, label: o.name }));

    return (
        <Grid templateColumns="repeat(12, 1fr)" gap={4} className="mb-2">
            {isEdit && <GridItem colSpan={12}>
                <FileUpload
                    label="Upload Avatar"
                    fileRole={FileRole.CharacterAvatar}
                    onUpload={onUpload}
                    isAvatar={true}
                    currentAvatarId={character?.avatarId}
                />
            </GridItem>}
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <TextInput
                    label="Name"
                    fieldName="name"
                    requiredMessage="Name is required"
                />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <NumberInput
                    label="Level"
                    fieldName="level"
                    requiredMessage="Level is required"
                />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput
                    label="Race"
                    fieldName="race"
                    options={raceOptions}
                    requiredMessage="Race is required"
                />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput
                    label="Class"
                    fieldName="className"
                    options={classOptions}
                    requiredMessage="Class is required"
                />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput
                    label="Subrace"
                    fieldName="subrace"
                    options={dynamicSubraceOptions}
                />
            </GridItem>
            <GridItem colSpan={{ base: 12, sm: 6 }}>
                <DropdownInput
                    label="Subclass"
                    fieldName="subclassName"
                    options={dynamicSubclassOptions}
                />
            </GridItem>
        </Grid>
    );
};