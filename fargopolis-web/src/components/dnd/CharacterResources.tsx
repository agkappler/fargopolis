import { FileRole } from "@/constants/FileRole";
import RequestManager from "@/helpers/RequestManager";
import FileMetadata from "@/models/FileMetadata";
import { useAuth } from "@clerk/react";
import { Box, Typography } from "@mui/material";
import useSWR from "swr";
import { FileUpload } from "../inputs/FileUpload";
import { FileWrapper } from "../ui/FileWrapper";
import { LoadingWrapper } from "../ui/LoadingWrapper";

interface CharacterResourcesProps {
    characterId: string;
}

export const CharacterResources: React.FC<CharacterResourcesProps> = ({ characterId }) => {
    const { getToken } = useAuth();
    const { data, isLoading, mutate } = useSWR<(string | number)[]>(
        `/character/${characterId}/resourceIds`,
        () => RequestManager.getGateway<(string | number)[]>(`/character/${characterId}/resourceIds`),
    );
    const onUpload = async (fileMetadata: FileMetadata) => {
        await RequestManager.postGatewayWithAuth(
            `/character/addResource?characterId=${characterId}&fileId=${fileMetadata.fileId}`,
            {},
            getToken,
        );
        mutate();
    }

    return <>
        <FileUpload fileRole={FileRole.CharacterResource} onUpload={onUpload} />
        <LoadingWrapper isLoading={isLoading}>
            <Box display="flex" justifyContent="center">
                {data && data?.length > 0
                    ? data.map(id => (
                        <Box margin={2} key={id}>
                            <FileWrapper fileId={id} />
                        </Box>
                    )) : <Typography textAlign="center">No resources yet!</Typography>
                }
            </Box>
        </LoadingWrapper>
    </>
}