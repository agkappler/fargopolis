import { DndItem, getRace } from "@/api/dnd5eapi";
import { Typography } from "@mui/material";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { RacialTraitCard } from "./RacialTraitCard";

interface RacialTraitsProps {
    race: string;
    characterId?: string;
}

export const RacialTraits: React.FC<RacialTraitsProps> = ({ race, characterId }) => {
    const { data: racialTraits, isLoading } = useSWR(race, () => getRace(race));
    return <LoadingWrapper isLoading={isLoading}>
        <Typography variant="h5" textAlign="center">{racialTraits?.name}</Typography>
        {racialTraits?.traits.map((t: DndItem, index: number) => (
            <RacialTraitCard
                key={index}
                trait={t}
                characterId={characterId}
                raceName={racialTraits?.name}
            />
        ))}
    </LoadingWrapper>
}