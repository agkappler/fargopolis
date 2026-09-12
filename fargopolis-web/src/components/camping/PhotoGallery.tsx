import { getErrorMessage } from "@/helpers/Errors";
import RequestManager, { ApiError } from "@/helpers/RequestManager";
import { errorToast } from "@/helpers/Toasts";
import Campsite from "@/models/Campsite";
import Visit from "@/models/Visit";
import { useAuth } from "@clerk/react";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";
import { PhotoThumbnail } from "./PhotoThumbnail";

interface PhotoGalleryProps {
    campsite: Campsite;
    visit: Visit;
    onChanged: (campsite: Campsite) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ campsite, visit, onChanged }) => {
    const { getToken, isSignedIn } = useAuth();
    const [dragIndex, setDragIndex] = useState<number>();

    if (!isSignedIn || visit.photoIds.length === 0) return null;

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
