import RequestManager from "@/helpers/RequestManager";
import SubclassFeature from "@/models/SubclassFeature";
import { Box, Typography } from "@mui/material";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { FeatureItem } from "./FeatureItem";

interface CustomSubclassInfoProps {
    subclassId: string;
}

export const CustomSubclassInfo: React.FC<CustomSubclassInfoProps> = ({ subclassId }) => {
    const { data: subclassFeatures, isLoading } = useSWR(
        subclassId ? ([`/gateway/subclasses`, subclassId, "features"] as const) : null,
        () => RequestManager.getGateway<SubclassFeature[]>(`/subclasses/${subclassId}/features`),
    );

    if (!subclassId) {
        return null;
    }

    return <>
        <LoadingWrapper isLoading={isLoading}>
            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                {(!subclassFeatures || subclassFeatures.length === 0) && (
                    <Typography variant="body1">No features yet!</Typography>
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
