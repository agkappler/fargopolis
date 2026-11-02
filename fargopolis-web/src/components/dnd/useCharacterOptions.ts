import { DndItem, getClasses, getRaces, getSubclasses, getSubraces } from "@/api/dnd5eapi";
import RequestManager from "@/helpers/RequestManager";
import CustomDndRace from "@/models/CustomDndRace";
import Subclass from "@/models/Subclass";
import { useAuth } from "@clerk/react";
import useSWR from "swr";

export interface CharacterOption {
    value: string;
    label: string;
}

/**
 * Race/class/subrace/subclass dropdown options, mirroring the loading logic in
 * CharacterForm + CharacterFormFields (same SWR keys, so the cache is shared).
 */
export function useCharacterOptions(selectedRace?: string, selectedClass?: string) {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const { data: classes } = useSWR<{ results: DndItem[] }>("/classes", () => getClasses());
    const { data: races } = useSWR<{ results: DndItem[] }>("/races", () => getRaces());
    const { data: customRaces } = useSWR(
        isLoaded ? (["customRacesGateway", isSignedIn] as const) : null,
        () => RequestManager.get<CustomDndRace[]>("/races", getToken),
    );

    const { data: subclassData } = useSWR(
        selectedClass ? `/classes/${selectedClass}/subclasses` : null,
        () => getSubclasses(selectedClass as string),
    );
    const { data: subraceData } = useSWR(
        selectedRace ? `/races/${selectedRace}/subraces` : null,
        () => getSubraces(selectedRace as string),
    );
    const { data: customSubclassesForClass } = useSWR<Subclass[]>(
        selectedClass ? ([`/gateway/subclasses/class`, selectedClass] as const) : null,
        () => RequestManager.get<Subclass[]>(`/subclasses/class/${selectedClass}`),
    );

    const allRaces = [...(races?.results ?? []), ...(customRaces ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    const allClasses = classes?.results ?? [];
    const allSubclasses = [...(subclassData?.results ?? []), ...(customSubclassesForClass ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    const allSubraces = subraceData?.results ?? [];

    const raceOptions: CharacterOption[] = allRaces.map(r => ({ value: r.index, label: r.name }));
    const classOptions: CharacterOption[] = allClasses.map(c => ({ value: c.index, label: c.name }));
    const subclassOptions: CharacterOption[] = allSubclasses.map(o => ({ value: o.index, label: o.name }));
    const subraceOptions: CharacterOption[] = allSubraces.map(o => ({ value: o.index, label: o.name }));

    return { raceOptions, classOptions, subraceOptions, subclassOptions };
}
