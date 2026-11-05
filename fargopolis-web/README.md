# fargopolis-web (Vite SPA)

Main client for Fargopolis. Dev server: `pnpm dev` (port **3000**; see `vite.config.ts`).

## Environment variables

Copy `[.env.example](.env.example)` to `.env` or `.env.local`.


| Variable | Role |
| -------- | ----- |
| `VITE_API_URL` | Base URL of the HTTP API (no trailing slash) — `HttpApiUrl` from `FargopolisApi` in production/CI. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (browser-only). Mutations send a session JWT; issuer is `context.clerk.jwtIssuer` on the authorizer Lambda. |


## Which API am I calling?

`[src/helpers/RequestManager.ts](src/helpers/RequestManager.ts)` uses API Gateway for all frontend API traffic:


| Use case                            | Methods                                               | Base URL                        | Credentials                                                  |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| Lambda reads (e.g. public bounties) | `getGateway`, `getGatewayWithAuth`                    | `VITE_API_URL` + `/api`         | `omit` (CORS)                                                |
| Lambda writes (Clerk)               | `postGatewayWithAuth`, `putGatewayWithAuth`, `deleteGatewayWithAuth` | `VITE_API_URL` + `/api`         | `omit` + `Authorization: Bearer` from `useAuth().getToken()` |


Path shape remains `**/api/...`**.

## Testing

Component and unit tests use [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) . Vitest reuses `vite.config.ts` (so the `@/` alias works); there is no separate Vitest config file. Pure-logic tests run in Node; component tests opt into jsdom and the shared setup at the top of the file:

```ts
// @vitest-environment jsdom
import "@/test/setup";
```

```bash
pnpm test          # run once
pnpm test:watch    # watch mode
```

- **Where tests go:** next to their source as `*.test.ts` / `*.test.tsx` under `src/`. Shared setup lives in `src/test/` (`setup.ts` adds `jest-dom` matchers, RTL cleanup, mock/global-stub restoring after each test, and jsdom stubs Chakra needs such as `ResizeObserver` and `matchMedia`).
- **Rendering components:** use `renderWithProviders` from `@/test/renderWithProviders` so the component renders inside the Chakra theme (`ThemeRegistry`).
- **Mocking Clerk:** mock `@clerk/react` with `vi.mock` and keep the auth state in `vi.hoisted` so each test can change it:

  ```ts
  const authState = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
  vi.mock("@clerk/react", () => ({ useAuth: () => authState }));
  ```

- **Stubbing `fetch`:** `vi.stubGlobal("fetch", vi.fn())` in a `beforeEach`. `setup.ts` undoes stubs and mocks after each test; a Node-environment test that doesn't import it should call `vi.unstubAllGlobals()` in its own `afterEach` (see `RequestManager.test.ts`).
- Tests are type-checked by `pnpm build` and linted by `pnpm lint`; `vite build` never bundles them.

## More documentation

- Repo root [README.md](../README.md) — runbooks and CDK static hosting.
- [infrastructure/README.md](../infrastructure/README.md) — `FargopolisApi` / `FargopolisFrontend`, Clerk context, bounties reference wiring.
- [recipes_dnd_migration.plan.md](../recipes_dnd_migration.plan.md) — completed Recipes + DnD migration record.
- [post_migration_cleanup.plan.md](../post_migration_cleanup.plan.md) — post-migration platform cleanup todos.

