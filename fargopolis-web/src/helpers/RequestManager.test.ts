import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RequestManager, { ApiError } from "./RequestManager";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

function lastRequest(): { url: string; init: RequestInit } {
    const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    return { url: String(url), init: init ?? {} };
}

describe("RequestManager.get", () => {
    it("calls the API without an Authorization header when no getToken is given", async () => {
        fetchMock.mockResolvedValue(new Response("", { status: 200 }));

        await RequestManager.get("/bounties");

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const { url, init } = lastRequest();
        // Only check the suffix: a local .env may set VITE_API_URL.
        expect(url.endsWith("/api/bounties")).toBe(true);
        const headers = init.headers as Record<string, string>;
        expect(headers.Authorization).toBeUndefined();
    });

    it("sends a Bearer token when getToken resolves one", async () => {
        fetchMock.mockResolvedValue(new Response("", { status: 200 }));

        await RequestManager.get("/bounties", () => Promise.resolve("tok"));

        const headers = lastRequest().init.headers as Record<string, string>;
        expect(headers.Authorization).toBe("Bearer tok");
    });

    it("resolves undefined for an empty body", async () => {
        fetchMock.mockResolvedValue(new Response("", { status: 200 }));

        await expect(RequestManager.get("/bounties")).resolves.toBeUndefined();
    });

    it("resolves the parsed JSON body", async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: "1" }), { status: 200 }));

        await expect(RequestManager.get("/bounties/1")).resolves.toEqual({ id: "1" });
    });

    it("rejects with an ApiError carrying the status and server message", async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ errorMessage: "nope" }), { status: 409 }));

        const error = await RequestManager.get("/bounties").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(409);
        expect((error as ApiError).message).toBe("nope");
    });
});

describe("RequestManager.post", () => {
    it("rejects without calling fetch when there is no token", async () => {
        await expect(
            RequestManager.post("/bounties", { name: "x" }, () => Promise.resolve(null)),
        ).rejects.toThrow("Sign in to perform this action.");

        expect(fetchMock).not.toHaveBeenCalled();
    });
});
