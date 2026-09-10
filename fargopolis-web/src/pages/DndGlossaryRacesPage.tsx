import { BaseDndResponse, getRaces } from "@/api/dnd5eapi";
import { RaceForm } from "@/components/dnd/race/RaceForm";
import { RacialTraits } from "@/components/dnd/race/RacialTraits";
import { Subraces } from "@/components/dnd/race/Subraces";
import { CustomRaceTraits } from "@/components/dnd/race/CustomRaceTraits";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import RequestManager from "@/helpers/RequestManager";
import CustomDndRace from "@/models/CustomDndRace";
import { useAuth } from "@clerk/react";
import { Plus } from "lucide-react";
import { Box, Button, NativeSelect, Tabs } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";

export function DndGlossaryRacesPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { data: apiRaceResults, isLoading: isLoadingApi } = useSWR<BaseDndResponse>("/races", () => getRaces());
    const {
        data: customRaces,
        isLoading: isLoadingCustomRaces,
        mutate,
    } = useSWR(
        isLoaded ? (["customRacesGateway", isSignedIn] as const) : null,
        () => RequestManager.get<CustomDndRace[]>("/races", getToken),
    );
    const races = [...(apiRaceResults?.results ?? []), ...((customRaces ?? []) as CustomDndRace[]).map((r) => new CustomDndRace(r))].sort((a, b) =>
        a.name.localeCompare(b.name)
    );
    const [selectedRace, setSelectedRace] = useState<string>("");
    const [isCustom, setIsCustom] = useState<boolean>(false);
    const selectedCustomRaceId = String(
        (races.find((r) => r.index === selectedRace) as CustomDndRace | undefined)?.raceId ?? "",
    );
    const [value, setValue] = useState("1");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const raceParam = searchParams.get("race");
        if (races.length > 0) {
            if (raceParam) {
                const raceObj = races.find((r) => r.index === raceParam);
                if (raceObj) {
                    setSelectedRace(raceParam);
                    setIsCustom("isCustom" in raceObj ? (raceObj as CustomDndRace).isCustom : false);
                }
            } else if (!selectedRace) {
                const firstRace = races[0];
                setSelectedRace(firstRace.index);
                setIsCustom("isCustom" in firstRace ? (firstRace as CustomDndRace).isCustom : false);
            }
        }
    }, [searchParams, races, selectedRace]);

    const handleRaceChange = (raceIndex: string) => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set("race", raceIndex);
        navigate(`/dnd/glossary/races?${newSearchParams.toString()}`, { replace: true });
    };

    return (
        <>
            <PageHeader
                title="DnD Races"
                rightContainer={
                    <Button variant="secondary" disabled={!isLoaded || !isSignedIn} onClick={() => setIsOpen(true)}>
                        <Plus size={16} />
                        Add Race
                    </Button>
                }
                leftContainer={<LinkButton url="/dnd/glossary" label="Glossary" isForward={false} />}
            />
            <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomRaces}>
                <Box display="flex" justifyContent="center">
                    <NativeSelect.Root width="auto">
                        <NativeSelect.Field value={selectedRace} onChange={(e) => handleRaceChange(e.target.value)}>
                            {races.map((r, index) => (
                                <option key={index} value={r.index}>
                                    {r.name}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>
                <Tabs.Root value={value} onValueChange={(e) => setValue(e.value)}>
                    <Box borderBottomWidth="1px" borderColor="border.DEFAULT" display="flex" justifyContent="center">
                        <Tabs.List aria-label="Character info tabs">
                            <Tabs.Trigger value="1">Race Info</Tabs.Trigger>
                            <Tabs.Trigger value="2">Subraces</Tabs.Trigger>
                        </Tabs.List>
                    </Box>
                    <Tabs.Content value="1">
                        {selectedRace &&
                            (isCustom ? (
                                selectedCustomRaceId ? (
                                    <CustomRaceTraits raceId={selectedCustomRaceId} />
                                ) : null
                            ) : (
                                <RacialTraits race={selectedRace} />
                            ))}
                    </Tabs.Content>
                    <Tabs.Content value="2">
                        <Subraces race={selectedRace} />
                    </Tabs.Content>
                </Tabs.Root>
            </LoadingWrapper>
            <RaceForm isOpen={isOpen} onClose={() => setIsOpen(false)} updateDndRaces={mutate} />
        </>
    );
}
