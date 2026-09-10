import RequestManager from "@/helpers/RequestManager";
import CustomDndRace from "@/models/CustomDndRace";
import { BaseDndResponse, getRaces } from "@/api/dnd5eapi";
import { useAuth } from "@clerk/react";
import { Box, Grid, GridItem, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { surfaceCardProps } from "../../ui/surfaceStyle";

export const RaceList: React.FC = () => {
    const navigate = useNavigate();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { data: apiRaceResults, isLoading: isLoadingApi } = useSWR<BaseDndResponse>('/races', () => getRaces());
    const { data: customRaces, isLoading: isLoadingCustomRaces } = useSWR(
        isLoaded ? (['customRacesGateway', isSignedIn] as const) : null,
        () => RequestManager.get<CustomDndRace[]>('/races', getToken),
    );
    const races = [...(apiRaceResults?.results ?? []), ...(customRaces ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    return <>
        <Heading size="lg" textAlign="center">Races</Heading>
        <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomRaces}>
            <Grid templateColumns="repeat(12, 1fr)" gap={4} textAlign="center">
                {races.map((r, index) => (<GridItem key={index} colSpan={{ base: 12, sm: 4 }}>
                    <Box {...surfaceCardProps} boxShadow="md" className="p-2" role="button" cursor="pointer" onClick={() => navigate(`/dnd/glossary/races?race=${r.index}`)}>
                        <Heading size="md">{r.name}</Heading>
                    </Box>
                </GridItem>))}
            </Grid>
        </LoadingWrapper>
    </>
}
