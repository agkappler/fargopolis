import { DndItem, getLevelInfoForSubclass, LevelInfo } from "@/api/dnd5eapi";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { ApiFeatureItem } from "./ApiFeatureItem";

interface SubclassInfoProps {
    subclassName: string;
}

export const SubclassInfo: React.FC<SubclassInfoProps> = ({ subclassName }) => {
    const { data: subclassInfo, isLoading } = useSWR(`/subclasses/${subclassName}/levels`, () => getLevelInfoForSubclass(subclassName));
    const features = subclassInfo?.flatMap((l: LevelInfo) => l.features.map((f: DndItem) => ({ ...f, levelInfo: l }))) ?? [];
    return <>
        <LoadingWrapper isLoading={isLoading}>
            {features.map((feature: { levelInfo: LevelInfo } & DndItem, index: number) => (
                <ApiFeatureItem key={index} feature={feature} />
            ))}
        </LoadingWrapper>
    </>
}