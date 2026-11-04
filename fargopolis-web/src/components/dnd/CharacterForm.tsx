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
import { ABILITY_KEYS } from "@/constants/Skills";
import type { AbilityKey } from "@/constants/Skills";

/** "" / null / undefined → undefined; otherwise Number(v). Inputs use plain register(), so values arrive as strings. */
const toNum = (v: unknown): number | undefined =>
    v === "" || v == null ? undefined : Number(v);

/** Copies only the keys whose value is defined. */
const definedOnly = <T extends Record<string, number | undefined>>(o: T): Partial<Record<keyof T, number>> =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<Record<keyof T, number>>;

/**
 * Builds the /updateCharacter body. Only stat fields the user filled in are included;
 * a missing key means "not provided".
 */
function buildUpdatePayload(data: Character): Record<string, unknown> {
    const { abilityScores, hitPoints, armorClass, initiativeBonus, speed,
        savingThrowProficiencies, skillProficiencies, ...identity } = data;
    const payload: Record<string, unknown> = { ...identity };

    const scores = definedOnly(Object.fromEntries(
        ABILITY_KEYS.map(k => [k, toNum(abilityScores?.[k])])
    ) as Record<AbilityKey, number | undefined>);
    if (Object.keys(scores).length > 0) payload.abilityScores = scores;

    const hp = definedOnly({
        current: toNum(hitPoints?.current),
        max: toNum(hitPoints?.max),
        temp: toNum(hitPoints?.temp),
    });
    if (Object.keys(hp).length > 0) payload.hitPoints = hp;

    const ac = toNum(armorClass);
    if (ac !== undefined) payload.armorClass = ac;
    const init = toNum(initiativeBonus);
    if (init !== undefined) payload.initiativeBonus = init;
    const spd = toNum(speed);
    if (spd !== undefined) payload.speed = spd;

    payload.savingThrowProficiencies = savingThrowProficiencies ?? [];
    payload.skillProficiencies = skillProficiencies ?? [];
    return payload;
}

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
        () => RequestManager.get<CustomDndRace[]>("/races", getToken),
    );

    // Combine API and custom data
    const allRaces = [...(races?.results ?? []), ...(customRaces ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    const allClasses = classes?.results ?? [];

    const raceOptions = allRaces.map(race => ({ value: race.index, label: race.name }));
    const classOptions = allClasses.map(classOption => ({ value: classOption.index, label: classOption.name }));

    const onSubmit = async (data: Character) => {
        try {
            if (isEdit) {
                await RequestManager.post("/updateCharacter", buildUpdatePayload(data), getToken);
            } else {
                await RequestManager.post("/createCharacter", data, getToken);
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateCharacters();
        closeForm();
    }

    const onUpload = async (fileMetadata: FileMetadata) => {
        await RequestManager.post(
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
