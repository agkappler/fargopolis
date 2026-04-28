# fargopolis-web (Vite SPA)

Main client for Fargopolis. Dev server: `pnpm dev` (port **3000**; see `vite.config.ts`).

## Environment variables

Copy `[.env.example](.env.example)` to `.env` or `.env.local`.


| Variable                         | Role                                                                                                                                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**VITE_API_URL`**               | Base URL of the **API Gateway** HTTP API (no trailing slash) — **Lambda** handlers (bounties, Recipes, in-scope DnD, files). **Production/CI:** set the same value to the `HttpApiUrl` output from `FargopolisApi`. |
| `**VITE_CLERK_PUBLISHABLE_KEY`** | Clerk publishable key (browser-only). Bounty **writes** send a session JWT; verification uses `context.clerk.jwtIssuer` on the **authorizer Lambda** in CDK, not the client.                                                  |


## Which API am I calling?

`[src/helpers/RequestManager.ts](src/helpers/RequestManager.ts)` uses API Gateway for all frontend API traffic:


| Use case                            | Methods                                               | Base URL                        | Credentials                                                  |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| Lambda reads (e.g. public bounties) | `getGateway`, `getGatewayWithAuth`                    | `VITE_API_URL` + `/api`         | `omit` (CORS)                                                |
| Lambda writes (Clerk)               | `postGatewayWithAuth`, `putGatewayWithAuth`, `deleteGatewayWithAuth` | `VITE_API_URL` + `/api`         | `omit` + `Authorization: Bearer` from `useAuth().getToken()` |


Path shape remains `**/api/...`**.

## More documentation

- Repo root [README.md](../README.md) — runbooks and CDK static hosting.
- [infrastructure/README.md](../infrastructure/README.md) — `FargopolisApi` / `FargopolisFrontend`, Clerk context, bounties reference wiring.
- [recipes_dnd_migration.plan.md](../recipes_dnd_migration.plan.md) — completed Recipes + DnD migration record.
- [post_migration_cleanup.plan.md](../post_migration_cleanup.plan.md) — post-migration platform cleanup todos.

