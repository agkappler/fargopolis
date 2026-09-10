import CustomDndRace from "@/models/CustomDndRace";
import { BaseDndResponse, getSubraces } from "@/api/dnd5eapi";
import { Box, Heading, NativeSelect } from "@chakra-ui/react";
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
        <Heading size="md" textAlign="center">{subraces.length ? "Subrace Info" : "No available subraces."}</Heading>
        <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomSubraces}>
            <Box display="flex" justifyContent="center">
                {subraces.length > 0 && (
                    <NativeSelect.Root width="auto">
                        <NativeSelect.Field
                            value={selectedSubrace}
                            onChange={(e) => setSelectedSubrace(e.target.value)}
                        >
                            {subraces.map((r, index) => (
                                <option key={index} value={r.index}>{r.name}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                )}
            </Box>
        </LoadingWrapper>
        {selectedSubrace && <SubraceInfo subraceName={selectedSubrace} />}
    </>
}
