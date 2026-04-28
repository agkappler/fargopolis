import { DndItem, getClasses, getRaces } from "@/api/dnd5eapi";
import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import CustomDndRace from "@/models/CustomDndRace";
import FileMetadata from "@/models/FileMetadata";
import { useAuth } from "@clerk/react";
import React, { useState } from "react";
import useSWR from "swr";
import Character from "@/models/Character";
import { BasicForm } from "../inputs/BasicForm";
import { SimpleDialog } from "../ui/SimpleDialog";
import { CharacterFormFields } from "./CharacterFormFields";

interface CharacterFormProps {
    isOpen: boolean;
    onClose: () => void;
    character?: Character;
    updateCharacters: () => void;
}

export const CharacterForm: React.FC<CharacterFormProps> = ({
    isOpen,
    onClose,
    character,
    updateCharacters
}) => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const isEdit = character !== undefined;
    const [errorMessage, setErrorMessage] = useState<string>();
    const closeForm = () => {
        setErrorMessage(undefined);
        onClose();
    }

    const { data: classes } = useSWR<{ results: DndItem[] }>("/classes", () => getClasses());
    const { data: races } = useSWR<{ results: DndItem[] }>("/races", () => getRaces());
    const { data: customRaces } = useSWR(
        isLoaded ? (["customRacesGateway", isSignedIn] as const) : null,
        () => RequestManager.getGatewayWithAuth<CustomDndRace[]>("/races", getToken),
    );

    // Combine API and custom data
    const allRaces = [...(races?.results ?? []), ...(customRaces ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    const allClasses = classes?.results ?? [];

    const raceOptions = allRaces.map(race => ({ value: race.index, label: race.name }));
    const classOptions = allClasses.map(classOption => ({ value: classOption.index, label: classOption.name }));

    const onSubmit = async (data: Character) => {
        try {
            if (isEdit) {
                await RequestManager.postGatewayWithAuth("/updateCharacter", data, getToken);
            } else {
                await RequestManager.postGatewayWithAuth("/createCharacter", data, getToken);
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateCharacters();
        closeForm();
    }

    const onUpload = async (fileMetadata: FileMetadata) => {
        await RequestManager.postGatewayWithAuth(
            `/updateAvatar?characterId=${character?.characterId}&fileId=${fileMetadata.fileId}`,
            {},
            getToken,
        );
        updateCharacters();
    }

    return (<SimpleDialog title={isEdit ? "Update Character" : "Create Character"} isOpen={isOpen} onClose={closeForm}>
        <BasicForm
            onSubmit={onSubmit}
            defaultValues={character}
            errorMessage={errorMessage}
            isClerkForm
        >
            <CharacterFormFields
                character={character}
                isEdit={isEdit}
                onUpload={onUpload}
                raceOptions={raceOptions}
                classOptions={classOptions}
            />
        </BasicForm>
    </SimpleDialog>)
}
