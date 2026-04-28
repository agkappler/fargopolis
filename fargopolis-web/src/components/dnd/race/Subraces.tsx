import CustomDndRace from "@/models/CustomDndRace";
import { BaseDndResponse, getSubraces } from "@/api/dnd5eapi";
import { Box, MenuItem, Select, Typography } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { SubraceInfo } from "./SubraceInfo";

interface SubracesProps {
    race: string;
}

export const Subraces: React.FC<SubracesProps> = ({ race }) => {
    const { data: apiSubraceResults, isLoading: isLoadingApi } = useSWR<BaseDndResponse>(
        `/races/${race}/subraces`, () => getSubraces(race),
        {
            onSuccess: (data) => setSelectedSubrace(data.results[0].index ?? ""),
            onError: () => setSelectedSubrace("")
        }
    );
    const isLoadingCustomSubraces = false,
        customSubraces: CustomDndRace[] = [];
    const subraces = [...(apiSubraceResults?.results ?? []), ...customSubraces].sort((a, b) => a.name.localeCompare(b.name));
    const [selectedSubrace, setSelectedSubrace] = useState<string>(subraces[0]?.index ?? "");
    return <>
        <Typography variant="h6" textAlign="center">{subraces.length ? "Subrace Info" : "No available subraces."}</Typography>
        <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomSubraces}>
            <Box display="flex" justifyContent="center">
                {subraces.length > 0 && (
                    <Select
                        value={selectedSubrace}
                        onChange={(e) => setSelectedSubrace(e.target.value as string)}
                    >
                        {subraces.map((r, index) => (
                            <MenuItem key={index} value={r.index}>{r.name}</MenuItem>
                        ))}
                    </Select>
                )}
            </Box>
        </LoadingWrapper>
        {selectedSubrace && <SubraceInfo subraceName={selectedSubrace} />}
    </>
}