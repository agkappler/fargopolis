import { useFileUrl } from "@/helpers/useFileMetadata";
import { Box, IconButton } from "@chakra-ui/react";
import { Star, X } from "lucide-react";

interface PhotoThumbnailProps {
    photoId: string;
    isCover: boolean;
    draggable: boolean;
    onDragStart: () => void;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    onDrop: () => void;
    onRemove?: () => void;
    onSetCover?: () => void;
}

export const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({
    photoId,
    isCover,
    draggable,
    onDragStart,
    onDragOver,
    onDrop,
    onRemove,
    onSetCover,
}) => {
    const { url } = useFileUrl(photoId);

    return (
        <Box
            position="relative"
            w="100px"
            h="100px"
            borderRadius="md"
            overflow="hidden"
            bg="bg.sunk"
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            borderWidth={isCover ? "2px" : "1px"}
            borderColor={isCover ? "ember.500" : "border"}
        >
            {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            {onSetCover && (
                <IconButton
                    aria-label={isCover ? "unset as cover photo" : "set as cover photo"}
                    size="xs"
                    position="absolute"
                    top="1"
                    left="1"
                    variant={isCover ? "solid" : "ghost"}
                    onClick={onSetCover}
                >
                    <Star size={12} fill={isCover ? "currentColor" : "none"} />
                </IconButton>
            )}
            {onRemove && (
                <IconButton
                    aria-label="remove photo"
                    size="xs"
                    position="absolute"
                    top="1"
                    right="1"
                    variant="ghost"
                    onClick={onRemove}
                >
                    <X size={12} />
                </IconButton>
            )}
        </Box>
    );
};
