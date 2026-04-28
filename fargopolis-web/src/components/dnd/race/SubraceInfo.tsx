import { DndItem, getSubraceTraits } from "@/api/dnd5eapi";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { RacialTraitCard } from "./RacialTraitCard";

interface SubraceInfoProps {
    subraceName: string;
}

export const SubraceInfo: React.FC<SubraceInfoProps> = ({ subraceName }) => {
    const { data: subraceInfo, isLoading } = useSWR(`/subraces/${subraceName}/traits`, () => getSubraceTraits(subraceName));
    console.log('subrace info', subraceInfo);
    const traits = subraceInfo?.results ?? [];

    return <>
        <LoadingWrapper isLoading={isLoading}>
            {traits.map((trait: DndItem, index: number) => (
                <RacialTraitCard key={index} trait={trait} />
            ))}
        </LoadingWrapper>
    </>
}