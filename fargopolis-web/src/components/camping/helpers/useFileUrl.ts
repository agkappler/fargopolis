import RequestManager from "@/helpers/RequestManager";
import FileMetadata from "@/models/FileMetadata";
import useSWR from "swr";

/**
 * Resolves a file id to its presigned S3 URL via `GET /api/fileUrl/{fileId}`.
 * Presigned URLs expire after ~15 minutes; SWR's default revalidate-on-focus
 * re-fetches a fresh one when the tab regains focus.
 */
export function useFileUrl(fileId: string | null | undefined) {
    const { data, isLoading } = useSWR<FileMetadata>(
        fileId ? `/fileUrl/${fileId}` : null,
        fileId ? () => RequestManager.get<FileMetadata>(`/fileUrl/${fileId}`) : null,
    );
    return { url: data?.url, isLoading };
}
