import { useFileMetadata } from "@/hooks/useFileMetadata";
import { Avatar, Box } from "@chakra-ui/react";
import { LoadingWrapper } from "./LoadingWrapper";

type ResponsiveSize = number | Partial<Record<"base" | "sm" | "md" | "lg" | "xl", number>>;

interface ImageBoxProps {
    fileId?: string | number | null;
    altText: string;
    size?: ResponsiveSize;
}

const toBoxSize = (size: ResponsiveSize) =>
    typeof size === "number"
        ? `${size}px`
        : Object.fromEntries(Object.entries(size).map(([key, value]) => [key, `${value}px`]));

export const ImageBox: React.FC<ImageBoxProps> = ({ fileId, altText, size = 100 }) => {
    const { data: fileMetadata, isLoading } = useFileMetadata(fileId);
    const boxSize = toBoxSize(size);
    const loadingSize = typeof size === "number" ? size : size.base ?? 100;

    if (!fileId) {
        return <Box margin="auto" boxSize={boxSize} borderRadius="full" bg="bg.sunk" border="1px solid" borderColor="border" aria-hidden="true" />;
    }

    return <LoadingWrapper isLoading={isLoading} size={loadingSize}>
        <Box margin="auto" boxSize={boxSize}>
            <Avatar.Root boxSize={boxSize}>
                <Avatar.Image src={fileMetadata?.url} alt={altText} />
                <Avatar.Fallback name={altText} />
            </Avatar.Root>
        </Box>
    </LoadingWrapper>
}
