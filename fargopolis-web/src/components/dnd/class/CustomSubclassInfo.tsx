import RequestManager from "@/helpers/RequestManager";
import SubclassFeature from "@/models/SubclassFeature";
import { Box, Text } from "@chakra-ui/react";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { FeatureItem } from "./FeatureItem";

interface CustomSubclassInfoProps {
    subclassId: string;
}

export const CustomSubclassInfo: React.FC<CustomSubclassInfoProps> = ({ subclassId }) => {
    const { data: subclassFeatures, isLoading } = useSWR(
        subclassId ? ([`/gateway/subclasses`, subclassId, "features"] as const) : null,
        () => RequestManager.get<SubclassFeature[]>(`/subclasses/${subclassId}/features`),
    );

    if (!subclassId) {
        return null;
    }

    return <>
        <LoadingWrapper isLoading={isLoading}>
            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                {(!subclassFeatures || subclassFeatures.length === 0) && (
                    <Text>No features yet!</Text>
                )}
                {subclassFeatures?.map((feature: SubclassFeature, index: number) => (
                    <FeatureItem
                        key={index}
                        name={feature.name}
                        level={feature.level}
                        descriptions={[feature.description]}
                    />
                ))}
            </Box>
        </LoadingWrapper>
    </>
}
