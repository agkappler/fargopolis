import { getRelativeUrlInfo } from "@/api/dnd5eapi";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { CreatingSpellSlotsTable } from "./class-specific/CreatingSpellSlotsTable";
import { FeatureAndLevel } from "./ClassFeatures";
import { FeatureItem } from "./FeatureItem";

interface FeatureCardProps {
    feature: FeatureAndLevel;
    characterId?: string;
    className?: string;
}

export const ApiFeatureItem: React.FC<FeatureCardProps> = ({ feature, characterId, className }) => {
    const { data: featureInfo, isLoading } = useSWR(feature.url, () => getRelativeUrlInfo(feature.url));

    return (
        <LoadingWrapper isLoading={isLoading} size={10}>
            <FeatureItem
                name={feature.name}
                level={featureInfo?.level}
                descriptions={featureInfo?.desc}
                characterId={characterId}
                className={className}
            >
                {featureInfo?.index === 'flexible-casting-creating-spell-slots' &&
                    <CreatingSpellSlotsTable creatingSpellSlots={feature.levelInfo.class_specific.creating_spell_slots} />
                }
            </FeatureItem>
        </LoadingWrapper>
    );
}