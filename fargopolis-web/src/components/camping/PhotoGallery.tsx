import { getErrorMessage } from "@/helpers/Errors";
import RequestManager, { ApiError } from "@/helpers/RequestManager";
import { errorToast } from "@/helpers/Toasts";
import Campsite from "@/models/Campsite";
import Visit from "@/models/Visit";
import { useAuth } from "@clerk/react";
import { Box, Flex, IconButton } from "@chakra-ui/react";
import { Star, X } from "lucide-react";
import { useState } from "react";
import { useFileUrl } from "./helpers/useFileUrl";

interface PhotoGalleryProps {
    campsite: Campsite;
    visit: Visit;
    onChanged: (campsite: Campsite) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ campsite, visit, onChanged }) => {
    const { getToken, isSignedIn } = useAuth();
    const [dragIndex, setDragIndex] = useState<number>();

    if (visit.photoIds.length === 0) return null;

    const persistOrder = async (photoIds: string[]) => {
        try {
            const saved = await RequestManager.post<
                { campsiteId: string; visitId: string; photoIds: string[] },
                Campsite
            >("/updateVisitPhotos", { campsiteId: campsite.campsiteId, visitId: visit.visitId, photoIds }, getToken);
            onChanged(saved);
        } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 409) {
                errorToast("This campsite changed elsewhere — reload and try again.");
            } else {
                errorToast(getErrorMessage(error));
            }
        }
    };

    const onRemove = (photoId: string) => void persistOrder(visit.photoIds.filter((id) => id !== photoId));

    const onDrop = (index: number) => {
        if (dragIndex !== undefined && dragIndex !== index) {
            const reordered = [...visit.photoIds];
            const [moved] = reordered.splice(dragIndex, 1);
            reordered.splice(index, 0, moved);
            void persistOrder(reordered);
        }
        setDragIndex(undefined);
    };

    const onSetCover = async (photoId: string) => {
        try {
            const saved = await RequestManager.post<{ campsiteId: string; coverPhotoId: string | null }, Campsite>(
                "/updateCampsiteCover",
                { campsiteId: campsite.campsiteId, coverPhotoId: campsite.coverPhotoId === photoId ? null : photoId },
                getToken,
            );
            onChanged(saved);
        } catch (error: unknown) {
            errorToast(getErrorMessage(error));
        }
    };

    return (
        <Flex gap={2} wrap="wrap" mt={2}>
            {visit.photoIds.map((photoId, index) => (
                <PhotoThumbnail
                    key={photoId}
                    photoId={photoId}
                    isCover={campsite.coverPhotoId === photoId}
                    draggable={!!isSignedIn}
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => onDrop(index)}
                    onRemove={isSignedIn ? () => onRemove(photoId) : undefined}
                    onSetCover={isSignedIn ? () => void onSetCover(photoId) : undefined}
                />
            ))}
        </Flex>
    );
};

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

const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({
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
