import RequestManager from "@/helpers/RequestManager";
import FileMetadata from "@/models/FileMetadata";
import { Avatar, Box } from "@chakra-ui/react";
import useSWR from "swr";
import { LoadingWrapper } from "./LoadingWrapper";

interface ImageBoxProps {
    fileId: string | number;
    altText: string;
}

export const ImageBox: React.FC<ImageBoxProps> = ({ fileId, altText }) => {
    const { data: fileMetadata, isLoading } = useSWR<FileMetadata>(
        `gw/fileUrl/${fileId}`,
        () => RequestManager.get<FileMetadata>(`/fileUrl/${fileId}`)
    );
    return <LoadingWrapper isLoading={isLoading} size={100}>
        <Box margin="auto" width={100}>
            <Avatar.Root boxSize="100px">
                <Avatar.Image src={fileMetadata?.url} alt={altText} />
                <Avatar.Fallback name={altText} />
            </Avatar.Root>
        </Box>
    </LoadingWrapper>
}
