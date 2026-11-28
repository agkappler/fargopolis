import { getRace } from "@/api/dnd5eapi";
import useSWR from "swr";

/** A race's base speed, used to prefill the Combat step. Custom races carry no speed to prefill from. */
export function useRaceSpeed(race?: string, isCustomRace?: boolean) {
    const { data } = useSWR(
        race && !isCustomRace ? `/races/${race}` : null,
        () => getRace(race as string),
    );
    return data?.speed;
}
