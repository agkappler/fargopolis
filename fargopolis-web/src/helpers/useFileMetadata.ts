import RequestManager from "@/helpers/RequestManager";
import FileMetadata from "@/models/FileMetadata";
import useSWR from "swr";

/**
 * Fetches a file's metadata (including its presigned URL) via `GET /api/fileUrl/{fileId}`.
 * The presigned URL expires after ~15 minutes; SWR's default revalidate-on-focus
 * re-fetches a fresh one when the tab regains focus.
 */
export function useFileMetadata(fileId: string | number | null | undefined) {
    const key = fileId !== null && fileId !== undefined ? `/fileUrl/${fileId}` : null;
    return useSWR<FileMetadata>(key, key ? () => RequestManager.get<FileMetadata>(key) : null);
}

/** Convenience wrapper around {@link useFileMetadata} for callers that only need the resolved URL. */
export function useFileUrl(fileId: string | number | null | undefined) {
    const { data, isLoading } = useFileMetadata(fileId);
    return { url: data?.url, isLoading };
}
