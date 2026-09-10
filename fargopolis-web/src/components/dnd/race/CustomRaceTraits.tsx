import RequestManager from "@/helpers/RequestManager";
import CustomDndRace from "@/models/CustomDndRace";
import RacialTrait from "@/models/RacialTrait";
import { useAuth } from "@clerk/react";
import { Wrench, Pencil } from "lucide-react";
import { Box, Grid, GridItem, Text } from "@chakra-ui/react";
import { useState } from "react";
import { surfaceCardProps } from "../../ui/surfaceStyle";
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
        () => RequestManager.get<CustomDndRace | null>(`/races/${raceId}`, getToken),
    );
    const { data: racialTraits, isLoading, mutate: updateTraits } = useSWR(
        raceId ? `/gateway/races/${raceId}/traits` : null,
        () => RequestManager.get<RacialTrait[]>(`/races/${raceId}/traits`),
    );
    const [isRaceFormOpen, setIsRaceFormOpen] = useState<boolean>(false);
    const [isTraitsFormOpen, setIsTraitsFormOpen] = useState<boolean>(false);

    const onCloseTraits = () => {
        setIsTraitsFormOpen(false);
    }

    const menuOptions: MenuOption[] = [
        {
            label: "Edit Race",
            icon: <Pencil size={16} />,
            onClick: () => setIsRaceFormOpen(true)
        },
        {
            label: "Manage Traits",
            icon: <Wrench size={16} />,
            onClick: () => setIsTraitsFormOpen(true)
        }
    ];

    return <>
        <LoadingWrapper isLoading={isLoading || isLoadingRace}>
            <Grid templateColumns="repeat(12, 1fr)">
                <GridItem colSpan={{ base: 12, md: 2 }}></GridItem>
                <GridItem colSpan={{ base: 12, md: 8 }}>
                    <Text fontFamily="display" fontSize="md" textAlign="center">{race?.name}</Text>
                </GridItem>
                <GridItem colSpan={{ base: 12, md: 2 }} display="flex" justifyContent="flex-end">
                    {isLoaded && isSignedIn && (
                        <ActionMenu
                            options={menuOptions}
                            ariaLabel="Race options"
                        />
                    )}
                </GridItem>
            </Grid>
            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                {(!racialTraits || racialTraits.length === 0) && (
                    <Text>No traits yet!</Text>
                )}
                {racialTraits?.map((trait: RacialTrait, index: number) => (
                    <Box key={index} {...surfaceCardProps} boxShadow="md" p={2} m={2} width="100%" maxWidth="600px">
                        <Text fontWeight="bold" textAlign="center">{trait.name}</Text>
                        <Text textAlign="center">{trait.description}</Text>
                    </Box>
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