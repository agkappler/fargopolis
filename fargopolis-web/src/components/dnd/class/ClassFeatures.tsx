import { DndItem, getLevelInfoForClass, LevelInfo } from "@/api/dnd5eapi";
import { Heading, Text } from "@chakra-ui/react";
import { capitalize } from "@/helpers/Format";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { ClassSpecificInfo } from "./ClassSpecificInfo";
import { ApiFeatureItem } from "./ApiFeatureItem";
import { DndClass, getNameForClass } from "@/constants/DndClass";

interface ClassFeaturesProps {
    currentLevel: number;
    className: DndClass;
    subclassName?: string;
    characterId?: string;
}

export interface FeatureAndLevel extends DndItem {
    levelInfo: LevelInfo;
}

export const ClassFeatures: React.FC<ClassFeaturesProps> = ({ currentLevel, className, characterId }) => {
    const { data: levelInfos, isLoading: isLoadingClassInfo } = useSWR<LevelInfo[]>(`/class/${className}/levels`, () => getLevelInfoForClass(className));
    const currentLevelInfo = levelInfos?.find(l => l.level === currentLevel);
    const activeLevelInfos = levelInfos?.filter(l => l.level <= currentLevel),
        activeLevelFeatures: FeatureAndLevel[] = activeLevelInfos?.flatMap((l: LevelInfo) => l.features.map((f: DndItem) => ({ ...f, levelInfo: l }))) ?? [],
        nextLevelInfo = levelInfos?.find(l => l.level === (currentLevel + 1)),
        nextLevelFeatures: FeatureAndLevel[] = nextLevelInfo?.features.map((f: DndItem) => ({ ...f, levelInfo: nextLevelInfo })) ?? [];
    const formattedClassName = getNameForClass(className);
    return <>
        <Heading size="lg" textAlign="left">{capitalize(className)}</Heading>
        <LoadingWrapper isLoading={isLoadingClassInfo}>
            {currentLevelInfo?.class_specific &&
                <ClassSpecificInfo levelInfo={currentLevelInfo} />
            }
            {activeLevelFeatures?.map((f: FeatureAndLevel) => (
                <ApiFeatureItem
                    key={f.index}
                    feature={f}
                    characterId={characterId}
                    className={formattedClassName}
                />
            ))}
            {currentLevel < 20 && (<>
                <Text textStyle="label" color="fg.muted" mt="4">Next Level Features</Text>
                {nextLevelFeatures?.map((f: FeatureAndLevel) => (
                    <ApiFeatureItem
                        key={f.index}
                        feature={f}
                        characterId={characterId}
                        className={formattedClassName}
                    />
                ))}
            </>)}
        </LoadingWrapper>
    </>
}