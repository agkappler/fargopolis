import { FileRole } from "@/constants/FileRole";

export default class FileMetadata {
    fileId: string | number;
    uuId: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
    fileRole: FileRole;
    url: string | undefined;

    constructor(
        fileId: string | number,
        uuId: string,
        filename: string,
        contentType: string,
        sizeBytes: number,
        fileRole: FileRole,
        url?: string
    ) {
        this.fileId = fileId;
        this.uuId = uuId;
        this.filename = filename;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.fileRole = fileRole;
        this.url = url;
    }
}