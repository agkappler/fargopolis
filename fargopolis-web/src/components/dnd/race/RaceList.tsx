import RequestManager from "@/helpers/RequestManager";
import CustomDndRace from "@/models/CustomDndRace";
import { BaseDndResponse, getRaces } from "@/api/dnd5eapi";
import { useAuth } from "@clerk/react";
import { Grid, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";

export const RaceList: React.FC = () => {
    const navigate = useNavigate();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { data: apiRaceResults, isLoading: isLoadingApi } = useSWR<BaseDndResponse>('/races', () => getRaces());
    const { data: customRaces, isLoading: isLoadingCustomRaces } = useSWR(
        isLoaded ? (['customRacesGateway', isSignedIn] as const) : null,
        () => RequestManager.getGatewayWithAuth<CustomDndRace[]>('/races', getToken),
    );
    const races = [...(apiRaceResults?.results ?? []), ...(customRaces ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    return <>
        <Typography variant="h5" textAlign="center">Races</Typography>
        <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomRaces}>
            <Grid container spacing={2} textAlign="center">
                {races.map((r, index) => (<Grid key={index} size={{ xs: 12, sm: 4 }}>
                    <Paper elevation={3} className="p-2" role="button" onClick={() => navigate(`/dnd/glossary/races?race=${r.index}`)}>
                        <Typography variant="h6">{r.name}</Typography>
                    </Paper>
                </Grid>))}
            </Grid>
        </LoadingWrapper>
    </>
}