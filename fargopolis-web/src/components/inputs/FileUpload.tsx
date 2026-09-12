import { FileRole } from "@/constants/FileRole";
import RequestManager from "@/helpers/RequestManager";
import { useFileMetadata } from "@/helpers/useFileMetadata";
import FileMetadata from "@/models/FileMetadata";
import { useAuth } from "@clerk/react";
import { Avatar, Button, Flex, IconButton } from "@chakra-ui/react";
import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

interface FileUploadButtonProps {
    fileRole: FileRole;
    label?: string;
    onUpload?: (fileMetadata: FileMetadata) => Promise<void>;
    isAvatar?: boolean;
    currentAvatarId?: string | number;
}

export const FileUpload: React.FC<FileUploadButtonProps> = ({
    fileRole,
    label = "Upload Files",
    onUpload,
    isAvatar = false,
    currentAvatarId,
}) => {
    const size = "100px";
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const canUpload = isLoaded && isSignedIn;
    const uploadFile = async (file: File) => {
        const fileMetadata: FileMetadata = await RequestManager.uploadFile(file, fileRole, getToken);
        if (onUpload) await onUpload(fileMetadata);

        return fileMetadata.url ?? "";
    }

    const { data: currentAvatarUrl } = useFileMetadata(currentAvatarId);
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (canUpload) inputRef.current?.click();
    };

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const url = await uploadFile(file);
        setImageUrl(url);
    };

    const avatarSrc = currentAvatarUrl?.url || imageUrl;

    return (
        <Flex direction="column" align="center">
            {isAvatar
                ? <IconButton aria-label={label} onClick={handleClick} variant="ghost" w={size} h={size} borderRadius="full" p="0">
                    <Avatar.Root w={size} h={size} border="2px dashed" borderColor="border.strong" bg="bg.sunk">
                        {avatarSrc
                            ? <Avatar.Image src={avatarSrc} />
                            : <Avatar.Fallback><UploadCloud size={28} /></Avatar.Fallback>}
                    </Avatar.Root>
                </IconButton>
                : !canUpload
                    ? <></>
                    : <Button onClick={handleClick}>
                        <UploadCloud size={16} />
                        {label}
                    </Button>
            }
            <input
                ref={inputRef}
                type="file"
                accept={isAvatar ? "image/*" : "*/*"}
                style={{ display: "none" }}
                onChange={handleChange}
            />
        </Flex>
    );
}
