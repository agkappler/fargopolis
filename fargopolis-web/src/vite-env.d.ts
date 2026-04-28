/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Base URL of the API Gateway HTTP API. */
    readonly VITE_API_URL?: string;
    /** Clerk publishable key for the SPA (`ClerkProvider`). */
    readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
