import { useFileMetadata } from "@/helpers/useFileMetadata";
import { Link } from "@chakra-ui/react";
import { File } from "lucide-react";
import { LoadingWrapper } from "./LoadingWrapper";

interface FileWrapperProps {
    fileId: string | number;
}

export const FileWrapper: React.FC<FileWrapperProps> = ({ fileId }) => {
    const { data: fileMetadata, isLoading } = useFileMetadata(fileId);
    const isImage = (filename: string) => ["jpg", "jpeg", "png", "gif", "webp"].includes(filename.split('.').pop()?.toLowerCase() || "");

    return <LoadingWrapper isLoading={isLoading} size={100}>
        {fileMetadata && (
            <Link href={fileMetadata.url} target="_blank" rel="noopener noreferrer" display="flex" flexDirection="column" alignItems="center">
                {isImage(fileMetadata.filename) && fileMetadata.url
                    ? (
                        <img
                            src={fileMetadata.url}
                            alt={fileMetadata.filename}
                            width={100}
                            height={100}
                            style={{ objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                        />
                    ) : (
                        <File size={64} color="var(--chakra-colors-fg-muted)" style={{ marginBottom: 4 }} />
                    )
                }
                {fileMetadata.filename}
            </Link>
        )}
    </LoadingWrapper>
}
