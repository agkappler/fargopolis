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
import { Add } from "@mui/icons-material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Button, MenuItem, Select, Tab } from "@mui/material";
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
    () => RequestManager.getGatewayWithAuth<CustomDndRace[]>("/races", getToken),
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
  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

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
          <Button startIcon={<Add />} disabled={!isLoaded || !isSignedIn} onClick={() => setIsOpen(true)}>
            Add Race
          </Button>
        }
        leftContainer={<LinkButton url="/dnd/glossary" label="Glossary" isForward={false} />}
      />
      <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomRaces}>
        <Box display="flex" justifyContent="center">
          <Select value={selectedRace} onChange={(e) => handleRaceChange(e.target.value as string)}>
            {races.map((r, index) => (
              <MenuItem key={index} value={r.index}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "center" }}>
            <TabList onChange={handleChange} aria-label="Character info tabs">
              <Tab label="Race Info" value="1" />
              <Tab label="Subraces" value="2" />
            </TabList>
          </Box>
          <TabPanel value="1">
            {selectedRace &&
              (isCustom ? (
                selectedCustomRaceId ? (
                  <CustomRaceTraits raceId={selectedCustomRaceId} />
                ) : null
              ) : (
                <RacialTraits race={selectedRace} />
              ))}
          </TabPanel>
          <TabPanel value="2">
            <Subraces race={selectedRace} />
          </TabPanel>
        </TabContext>
      </LoadingWrapper>
      <RaceForm isOpen={isOpen} onClose={() => setIsOpen(false)} updateDndRaces={mutate} />
    </>
  );
}
