import RequestManager from "@/helpers/RequestManager";
import FileMetadata from "@/models/FileMetadata";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Link } from "@mui/material";
import useSWR from "swr";
import { LoadingWrapper } from "./LoadingWrapper";

interface FileWrapperProps {
    fileId: string | number;
}

export const FileWrapper: React.FC<FileWrapperProps> = ({ fileId }) => {
    const { data: fileMetadata, isLoading } = useSWR<FileMetadata>(
        `gw/fileUrl/${fileId}`,
        () => RequestManager.getGateway<FileMetadata>(`/fileUrl/${fileId}`)
    );
    const isImage = (filename: string) => ["jpg", "jpeg", "png", "gif", "webp"].includes(filename.split('.').pop()?.toLowerCase() || "");

    return <LoadingWrapper isLoading={isLoading} size={100}>
        {fileMetadata && (
            <Link href={fileMetadata.url} target="_blank" rel="noopener noreferrer" sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                        <InsertDriveFileIcon sx={{ fontSize: 64, color: "action.active", marginBottom: 1 }} />
                    )
                }
                {fileMetadata.filename}
            </Link>
        )}
    </LoadingWrapper>
}