import { FileRole } from "@/constants/FileRole";
import { getErrorMessage } from "@/helpers/Errors";
import RequestManager, { ApiError } from "@/helpers/RequestManager";
import { errorToast } from "@/helpers/Toasts";
import Campsite from "@/models/Campsite";
import Visit from "@/models/Visit";
import { useAuth } from "@clerk/react";
import { Box, Text } from "@chakra-ui/react";
import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

interface PhotoUploaderProps {
    campsite: Campsite;
    visit: Visit;
    onSaved: (campsite: Campsite) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ campsite, visit, onSaved }) => {
    const { getToken, isSignedIn } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    if (!isSignedIn) return null;

    const uploadFiles = async (files: FileList | File[]) => {
        const fileList = Array.from(files);
        if (fileList.some((file) => file.size > MAX_PHOTO_BYTES)) {
            errorToast("Photos must be 15 MB or smaller.");
            return;
        }

        setIsUploading(true);
        try {
            const newPhotoIds: string[] = [];
            for (const file of fileList) {
                const metadata = await RequestManager.uploadFile(file, FileRole.CampsitePhoto, getToken);
                newPhotoIds.push(String(metadata.fileId));
            }
            const saved = await RequestManager.post<
                { campsiteId: string; visitId: string; photoIds: string[] },
                Campsite
            >(
                "/updateVisitPhotos",
                { campsiteId: campsite.campsiteId, visitId: visit.visitId, photoIds: [...visit.photoIds, ...newPhotoIds] },
                getToken,
            );
            onSaved(saved);
        } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 409) {
                errorToast("This campsite changed elsewhere — reload and try again.");
            } else {
                errorToast(getErrorMessage(error));
            }
        } finally {
            setIsUploading(false);
        }
    };

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
        if (event.dataTransfer.files.length > 0) void uploadFiles(event.dataTransfer.files);
    };

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) void uploadFiles(event.target.files);
        event.target.value = "";
    };

    return (
        <Box
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            border="1px dashed"
            borderColor={isDragOver ? "ember.500" : "border.strong"}
            borderRadius="md"
            p={2}
            mt={2}
            textAlign="center"
            cursor="pointer"
            color="fg.muted"
            bg={isDragOver ? "bg.sunk" : "transparent"}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={onInputChange}
            />
            <Text fontSize="sm" display="flex" alignItems="center" justifyContent="center" gap="1.5">
                <UploadCloud size={14} />
                {isUploading ? "Uploading…" : "Drop photos here or click to upload"}
            </Text>
        </Box>
    );
};
