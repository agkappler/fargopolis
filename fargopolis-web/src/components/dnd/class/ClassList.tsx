import { BaseDndResponse, DndItem, getClasses } from "@/api/dnd5eapi";
import { Grid, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";

export const ClassList: React.FC = () => {
    const navigate = useNavigate();
    const { data: apiClassResults, isLoading: isLoadingApi } = useSWR<BaseDndResponse>('/classes', () => getClasses());
    const customClasses: DndItem[] = [],
        isLoadingCustomClasses = false;
    const classes = [...(apiClassResults?.results ?? []), ...customClasses].sort((a, b) => a.name.localeCompare(b.name));
    return <>
        <Typography variant="h5" textAlign="center">Classes</Typography>
        <LoadingWrapper isLoading={isLoadingApi || isLoadingCustomClasses}>
            <Grid container spacing={2} textAlign="center">
                {classes.map((c, index) => (<Grid key={index} size={{ xs: 12, sm: 4 }}>
                    <Paper elevation={3} className="p-2" role="button" onClick={() => navigate(`/dnd/glossary/classes?class=${c.index}`)}>
                        <Typography variant="h6">{c.name}</Typography>
                    </Paper>
                </Grid>))}
            </Grid>
        </LoadingWrapper>
    </>
}