import { BaseDndResponse, DndItem, getClasses } from "@/api/dnd5eapi";
import { Box, Grid, GridItem, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { surfaceCardProps } from "../../ui/surfaceStyle";

export const ClassList: React.FC = () => {
    const navigate = useNavigate();
    const { data: apiClassResults, isLoading: isLoadingApi } = useSWR<BaseDndResponse>('/classes', () => getClasses());
    const customClasses: DndItem[] = [],
        isLoadingCustomClasses = false;
    const classes = [...(apiClassResults?.results ?? []), ...customClasses].sort((a, b) => a.name.localeCompare(b.name));
    return <>
        <Heading size="lg" textAlign="center">Classes</Heading>
        <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomClasses}>
            <Grid templateColumns="repeat(12, 1fr)" gap={4} textAlign="center">
                {classes.map((c, index) => (<GridItem key={index} colSpan={{ base: 12, sm: 4 }}>
                    <Box {...surfaceCardProps} boxShadow="md" className="p-2" role="button" cursor="pointer" onClick={() => navigate(`/dnd/glossary/classes?class=${c.index}`)}>
                        <Heading size="md">{c.name}</Heading>
                    </Box>
                </GridItem>))}
            </Grid>
        </LoadingWrapper>
    </>
}
