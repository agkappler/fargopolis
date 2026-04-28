import RequestManager from "@/helpers/RequestManager";
import CustomDndRace from "@/models/CustomDndRace";
import RacialTrait from "@/models/RacialTrait";
import { useAuth } from "@clerk/react";
import { Build, Edit } from "@mui/icons-material";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";
import { ActionMenu, MenuOption } from "../../ui/ActionMenu";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { RaceForm } from "./RaceForm";
import { RacialTraitsForm } from "./RacialTraitsForm";

interface CustomRaceTraitsProps {
    raceId: string;
}

export const CustomRaceTraits: React.FC<CustomRaceTraitsProps> = ({ raceId }) => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { data: race, isLoading: isLoadingRace, mutate: mutateRace } = useSWR(
        raceId ? `/gateway/races/${raceId}` : null,
        () => RequestManager.getGatewayWithAuth<CustomDndRace | null>(`/races/${raceId}`, getToken),
    );
    const { data: racialTraits, isLoading, mutate: updateTraits } = useSWR(
        raceId ? `/gateway/races/${raceId}/traits` : null,
        () => RequestManager.getGateway<RacialTrait[]>(`/races/${raceId}/traits`),
    );
    const [isRaceFormOpen, setIsRaceFormOpen] = useState<boolean>(false);
    const [isTraitsFormOpen, setIsTraitsFormOpen] = useState<boolean>(false);

    const onCloseTraits = () => {
        setIsTraitsFormOpen(false);
    }

    const menuOptions: MenuOption[] = [
        {
            label: "Edit Race",
            icon: <Edit />,
            onClick: () => setIsRaceFormOpen(true)
        },
        {
            label: "Manage Traits",
            icon: <Build />,
            onClick: () => setIsTraitsFormOpen(true)
        }
    ];

    return <>
        <LoadingWrapper isLoading={isLoading || isLoadingRace}>
            <Grid container>
                <Grid size={{ md: 2 }}></Grid>
                <Grid size={{ md: 8 }}>
                    <Typography variant="h6" textAlign="center">{race?.name}</Typography>
                </Grid>
                <Grid size={{ md: 2 }} className="flex justify-end">
                    {isLoaded && isSignedIn && (
                        <ActionMenu
                            options={menuOptions}
                            ariaLabel="Race options"
                        />
                    )}
                </Grid>
            </Grid>
            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                {(!racialTraits || racialTraits.length === 0) && (
                    <Typography variant="body1">No traits yet!</Typography>
                )}
                {racialTraits?.map((trait: RacialTrait, index: number) => (
                    <Paper key={index} elevation={3} className="p-2 m-2" sx={{ width: '100%', maxWidth: 600 }}>
                        <Typography variant="subtitle1" fontWeight="bold" textAlign="center">{trait.name}</Typography>
                        <Typography variant="body1" textAlign="center">{trait.description}</Typography>
                    </Paper>
                ))}
            </Box>
            <RaceForm
                isOpen={isRaceFormOpen}
                onClose={() => setIsRaceFormOpen(false)}
                dndRace={race ? new CustomDndRace(race as CustomDndRace) : undefined}
                updateDndRaces={mutateRace}
            />
            <RacialTraitsForm
                isOpen={isTraitsFormOpen}
                onClose={onCloseTraits}
                racialTraits={racialTraits}
                updateTraits={updateTraits}
                raceId={raceId}
            />
        </LoadingWrapper>
    </>
}