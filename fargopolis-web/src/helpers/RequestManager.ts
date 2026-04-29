import { FileRole } from "@/constants/FileRole";
import FileMetadata from "@/models/FileMetadata";

interface PresignPutResponse extends FileMetadata {
    uploadUrl: string;
    uploadMethod: "PUT";
    uploadHeaders: Record<string, string>;
    objectKey: string;
}

export default class RequestManager {
    private static baseUrl = import.meta.env.VITE_API_URL ?? "";
    private static apiUrl = `${this.baseUrl}/api`;

    /**
     * Authenticated GET (sends Clerk Bearer when a token is available).
     */
    static async get<T = unknown>(url: string, getToken?: () => Promise<string | null>): Promise<T> {
        const token = await getToken?.() ?? undefined;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return this.getWithBase<T>(this.apiUrl, url, "omit", headers);
    }

    /**
     * Post, requires a signed-in user.
     */
    static async post<TRequest = unknown, TResponse = unknown>(
        url: string,
        data: TRequest,
        getToken: () => Promise<string | null>,
    ): Promise<TResponse> {
        const token = await getToken();
        if (!token) {
            throw new Error("Sign in to perform this action.");
        }
        return this.postWithBase<TRequest, TResponse>(
            this.apiUrl,
            url,
            data,
            {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            "omit",
        );
    }

    /**
     * Put, requires a signed-in user.
     */
    static async put<TRequest = unknown, TResponse = unknown>(
        url: string,
        data: TRequest,
        getToken: () => Promise<string | null>,
    ): Promise<TResponse> {
        const token = await getToken();
        if (!token) {
            throw new Error("Sign in to perform this action.");
        }
        const response = await fetch(this.apiUrl + url, {
            method: "PUT",
            credentials: "omit",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return await this.handleResponse<TResponse>(response);
    }

    /**
     * Delete, requires a signed-in user.
     */
    static async delete<TResponse = unknown>(
        url: string,
        getToken: () => Promise<string | null>,
    ): Promise<TResponse> {
        const token = await getToken();
        if (!token) {
            throw new Error("Sign in to perform this action.");
        }
        const response = await fetch(this.apiUrl + url, {
            method: "DELETE",
            credentials: "omit",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        return await this.handleResponse<TResponse>(response);
    }

    private static async getWithBase<T>(
        urlBase: string,
        path: string,
        credentials: RequestCredentials = "omit",
        headers?: HeadersInit,
    ): Promise<T> {
        const response = await fetch(urlBase + path, {
            method: "GET",
            credentials,
            headers: headers ?? { "Content-Type": "application/json" },
        });

        return await this.handleResponse(response);
    }

    private static async postWithBase<TRequest = unknown, TResponse = unknown>(
        urlBase: string,
        path: string,
        data: TRequest,
        customHeaders?: HeadersInit,
        credentials: RequestCredentials = "omit",
    ): Promise<TResponse> {
        const response = await fetch(urlBase + path, {
            method: "POST",
            credentials,
            headers: customHeaders ?? {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        return await this.handleResponse<TResponse>(response);
    }

    /**
     * Upload a file to S3.
     */
    static async uploadFile(
        file: File,
        fileRole: FileRole,
        getToken: () => Promise<string | null>,
    ): Promise<FileMetadata> {
        const payload = {
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            fileRole,
        };
        const presign = await this.post<typeof payload, PresignPutResponse>(
            "/files/presignPut",
            payload,
            getToken
        );
        const uploadResponse = await fetch(presign.uploadUrl, {
            method: presign.uploadMethod,
            headers: presign.uploadHeaders,
            body: file,
        });
        if (!uploadResponse.ok) {
            throw new Error("Failed to upload file to S3.");
        }
        return presign;
    }

    private static async handleResponse<T = unknown>(response: Response): Promise<T> {
        if (!response.ok) {
            let errorData: { errorMessage?: string; message?: string } = {
                errorMessage: "An error occurred while fetching data.",
            };
            try {
                errorData = await response.json();
            } catch (error) {
                console.error("Error parsing error response:", error);
            }

            const msg = errorData.errorMessage ?? errorData.message ?? "An error occurred while fetching data.";
            throw new Error(msg);
        }

        const text = await response.text();
        if (!text.trim()) {
            return undefined as T;
        }
        return JSON.parse(text) as T;
    }
}