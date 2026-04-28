import { FileRole } from "@/constants/FileRole";
import FileMetadata from "@/models/FileMetadata";

interface PresignPutResponse extends FileMetadata {
    uploadUrl: string;
    uploadMethod: "PUT";
    uploadHeaders: Record<string, string>;
    objectKey: string;
}

export default class RequestManager {
    private static baseGatewayUrl = import.meta.env.VITE_API_URL ?? "";
    private static gatewayApiUrl = `${this.baseGatewayUrl}/api`;

    /** Bounty read routes — public GET when using API Gateway + Lambda. */
    static async getGateway<T = unknown>(url: string): Promise<T> {
        return this.getWithBase<T>(this.gatewayApiUrl, url, "omit", { "Content-Type": "application/json" });
    }

    /**
     * Authenticated GET on the API Gateway (sends Clerk Bearer when a token is available).
     * Use for routes that return user-specific data when signed in (e.g. custom DnD races).
     */
    static async getGatewayWithAuth<T = unknown>(url: string, getToken: () => Promise<string | null>): Promise<T> {
        const token = await getToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return this.getWithBase<T>(this.gatewayApiUrl, url, "omit", headers);
    }

    /**
     * Bounty mutations — sends Clerk session JWT (`Authorization: Bearer`).
     * Requires `VITE_CLERK_PUBLISHABLE_KEY` (Clerk SPA) and a signed-in user.
     */
    static async postGatewayWithAuth<TRequest = unknown, TResponse = unknown>(
        url: string,
        data: TRequest,
        getToken: () => Promise<string | null>,
    ): Promise<TResponse> {
        const token = await getToken();
        if (!token) {
            throw new Error("Sign in to perform this action.");
        }
        return this.postWithBase<TRequest, TResponse>(
            this.gatewayApiUrl,
            url,
            data,
            {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            "omit",
        );
    }

    static async putGatewayWithAuth<TRequest = unknown, TResponse = unknown>(
        url: string,
        data: TRequest,
        getToken: () => Promise<string | null>,
    ): Promise<TResponse> {
        const token = await getToken();
        if (!token) {
            throw new Error("Sign in to perform this action.");
        }
        const response = await fetch(this.gatewayApiUrl + url, {
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

    static async deleteGatewayWithAuth<TResponse = unknown>(
        url: string,
        getToken: () => Promise<string | null>,
    ): Promise<TResponse> {
        const token = await getToken();
        if (!token) {
            throw new Error("Sign in to perform this action.");
        }
        const response = await fetch(this.gatewayApiUrl + url, {
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

    static async uploadFileGatewayWithAuth(
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
        const presign = await this.postGatewayWithAuth<typeof payload, PresignPutResponse>(
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