# fargopolis-web (Vite SPA)

Main client for Fargopolis. Dev server: `pnpm dev` (port **3000**; see `vite.config.ts`).

## Environment variables

Copy `[.env.example](.env.example)` to `.env` or `.env.local`.


| Variable                         | Role                                                                                                                                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**VITE_API_URL`**               | Base URL of the **Spring** API (no trailing slash), e.g. `http://localhost:8080`. Used for **legacy** routes that still hit Java + Postgres.                                                                                  |
| `**VITE_API_GATEWAY_URL`**       | Base URL of the **API Gateway** HTTP API (no trailing slash) — **Lambda** handlers (bounties, Recipes, in-scope DnD, files). **Production/CI:** set the same value to the `HttpApiUrl` output from `FargopolisApi`. |
| `**VITE_CLERK_PUBLISHABLE_KEY`** | Clerk publishable key (browser-only). Bounty **writes** send a session JWT; verification uses `context.clerk.jwtIssuer` on the **authorizer Lambda** in CDK, not the client.                                                  |


## Which API am I calling?

`[src/helpers/RequestManager.ts](src/helpers/RequestManager.ts)` encodes the strangler:


| Use case                            | Methods                               | Base URL                        | Credentials                                                  |
| ----------------------------------- | ------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| Legacy Java + session               | `get`, `post`, etc. (default helpers) | `VITE_API_URL` + `/api`         | `include` (cookies)                                          |
| Lambda reads (e.g. public bounties) | `getGateway`                          | `VITE_API_GATEWAY_URL` + `/api` | `omit` (CORS)                                                |
| Lambda writes (Clerk)               | `postGatewayWithAuth`                 | `VITE_API_GATEWAY_URL` + `/api` | `omit` + `Authorization: Bearer` from `useAuth().getToken()` |


Path shape is the same: `**/api/...`** in both cases, mirroring the Java `BaseApiController` prefix.

As verticals migrate, move their fetches from `get`/`post` to `getGateway` / `postGatewayWithAuth` so traffic follows the new stack; unmigrated features keep using Java.

## More documentation

- Repo root [README.md](../README.md) — runbooks and CDK static hosting.
- [infrastructure/README.md](../infrastructure/README.md) — `FargopolisApi` / `FargopolisFrontend`, Clerk context, bounties reference wiring.
- [recipes_dnd_migration.plan.md](../recipes_dnd_migration.plan.md) — completed Recipes + DnD migration record.
- [post_migration_cleanup.plan.md](../post_migration_cleanup.plan.md) — post-migration platform cleanup todos.

