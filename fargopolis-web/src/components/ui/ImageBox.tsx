import { useFileMetadata } from "@/helpers/useFileMetadata";
import { Avatar, Box } from "@chakra-ui/react";
import { LoadingWrapper } from "./LoadingWrapper";

interface ImageBoxProps {
    fileId: string | number;
    altText: string;
}

export const ImageBox: React.FC<ImageBoxProps> = ({ fileId, altText }) => {
    const { data: fileMetadata, isLoading } = useFileMetadata(fileId);
    return <LoadingWrapper isLoading={isLoading} size={100}>
        <Box margin="auto" width={100}>
            <Avatar.Root boxSize="100px">
                <Avatar.Image src={fileMetadata?.url} alt={altText} />
                <Avatar.Fallback name={altText} />
            </Avatar.Root>
        </Box>
    </LoadingWrapper>
}
