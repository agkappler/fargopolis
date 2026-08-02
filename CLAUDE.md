# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture at a glance

Fargopolis is an AWS-first, two-package monorepo: a **Vite SPA** frontend and a **serverless API** defined via CDK.

| Layer | What it is | Location |
| ----- | ---------- | -------- |
| Frontend | Vite + React + TypeScript SPA, hosted on S3 + CloudFront | [`fargopolis-web/`](fargopolis-web/) |
| API | API Gateway (HTTP API) + Python Lambdas, one per vertical | [`infrastructure/lambdas/`](infrastructure/lambdas/) |
| IaC | AWS CDK (TypeScript) provisioning both stacks | [`infrastructure/lib/`](infrastructure/lib/) |
| Data | DynamoDB tables, one per domain (bounties, recipes, DnD, files) | provisioned in `infrastructure/lib/constructs/` |
| Auth | Clerk JWT, validated by a custom Lambda authorizer on the HTTP API | `infrastructure/lambdas/clerk_authorizer/` |

The frontend and API are two separate CDK stacks (`FargopolisFrontend`, `FargopolisApi`) that deploy and version independently; the SPA talks to the API purely over HTTP via `VITE_API_URL`.

## Commands

### Frontend (`fargopolis-web/`)

```bash
cd fargopolis-web
pnpm install
pnpm dev            # dev server on port 3000
pnpm build           # tsc --noEmit && vite build
pnpm lint            # eslint . --quiet (errors only)
pnpm lint-warn       # eslint . (include warnings)
pnpm ts-lint         # tsc --noEmit && eslint . --fix
```

There is no test suite in this package — `build`/`lint` are the correctness gates.

### Infrastructure (`infrastructure/`)

```bash
cd infrastructure
npm ci
npx cdk list                              # FargopolisApi, FargopolisFrontend
npx cdk synth
npx cdk deploy FargopolisApi              # or FargopolisFrontend, or --all
npx cdk diff FargopolisApi
```

Add `--profile YOUR_PROFILE` (or `export AWS_PROFILE=...`) for named AWS credentials.

### Python Lambdas (local editor/type-checking only)

```bash
./scripts/setup-python-lambdas.sh   # creates repo .venv with a Python 3.10+ interpreter
source .venv/bin/activate
```

CDK needs a local Python 3.10+ (3.12 matches the Lambda runtime) on `PATH` to bundle Lambdas without Docker; macOS's stock `python3` (Xcode CLT) is often 3.9 and too old. `pyrightconfig.json` points the editor at `infrastructure/lambdas` with `shared/` as an extra path — select `.venv/bin/python` as the interpreter.

Dependency source of truth is **per-lambda `requirements.txt`** (e.g. `infrastructure/lambdas/bounties/requirements.txt`), not a repo-wide file. `infrastructure/lambdas/requirements-dev.txt` aggregates those plus local-only helpers (`boto3`, provided by the Lambda runtime in prod). To add a dependency: add it to the specific lambda's `requirements.txt`, rerun the setup script, and redeploy `FargopolisApi` so CDK bundles it.

## Adding a new API vertical

Follow the existing pattern (bounties is the reference implementation):

1. Add DynamoDB table(s) as a new construct in `infrastructure/lib/constructs/` (e.g. `*-construct.ts`).
2. Add a Lambda directory under `infrastructure/lambdas/<name>/` with `handler.py` + `requirements.txt`; attach `PythonSharedLayerConstruct` if it imports `infrastructure/lambdas/shared/`.
3. Add a routes construct (e.g. `<name>-api-routes-construct.ts`) that registers integrations on the **same** shared `HttpApi` from `FargopolisHttpApiConstruct` — don't create a new API Gateway.
4. Wire the new constructs into `lib/stacks/fargopolis-api-stack.ts` and add `CfnOutput`s as needed.
5. If the vertical needs file uploads: set `UPLOADS_BUCKET_ENV_NAME` and the concrete bucket env var from `this.userUploads.bucket.bucketName`, then call `this.userUploads.grantReadWrite(yourHandler)`. Prefer routing through the dedicated `FilesApiRoutesConstruct` (presigned PUT/GET) instead of giving new handlers direct S3 IAM.
6. On the frontend, call the new routes through `RequestManager` (`fargopolis-web/src/helpers/RequestManager.ts`), not raw `fetch`.

## Auth model

- Clerk issues JWTs; the HTTP API's default authorizer (`ClerkHttpAuthorizerConstruct` → `clerk_authorizer/handler.py`) validates them via JWKS (RS256) against `context.clerk.jwtIssuer` in `infrastructure/cdk.json`.
- Lambda handlers read auth state from the authorizer context via `shared.lambda_utils.authorizer_lambda_context()` / `require_clerk_writer()` — they never re-verify the JWT themselves.
- On the frontend, `RequestManager` has two call families: unauthenticated/optionally-authenticated reads (`get`, which sends a Bearer token only if `getToken` is supplied) and writes that require a signed-in user (`post`/`put`/`delete`, which throw if no token is available). All requests go through `VITE_API_URL + /api`.
- Clerk's JWT `azp` claim is the request Origin, not the publishable key — don't compare it to `pk_*`.

## DynamoDB conventions

Tables are per-domain (not single-table design) and use **on-demand capacity**. When adding access patterns or new tables:

- Design partition/sort keys from concrete access patterns first (get-by-id, list-by-category, etc.), not from "tables" as a starting point. Prefer a `Query` (base table or GSI) over `Scan`; reserve `Scan` for admin/batch paths.
- Denormalize on purpose — store what a screen needs directly on the item (or in a GSI projection); there are no server-side joins. Model 1:N by nesting children under a parent PK with a predictable SK (e.g. `ITEM#<id>`, `METADATA`), so one `Query` returns the group.
- Avoid hot partitions: never use a single low-cardinality value (a global status/counter) as PK for high-traffic writes; shard counters if needed.
- Keep items well under 400 KB; large files go in S3 (the `FargopolisBucket` user-uploads bucket) with only the key/URL stored in Dynamo.
- Use `ConditionExpression` for optimistic concurrency and `TransactWriteItems`/`TransactGetItems` only for small, well-defined atomic updates — not as a general ACID substitute.

## Frontend structure notes

- Path alias `@/*` → `fargopolis-web/src/*` (see `tsconfig.json`).
- `src/helpers/RequestManager.ts` is the single point of contact with the API — route all new API calls through it rather than calling `fetch` directly.
- `src/components/` is organized by vertical (`bounties/`, `recipes/`, `dnd/`, `about/`, `home/`, `navigation/`, `inputs/`, `ui/`), mirroring the API's vertical split.
- `src/api/` holds clients for *external* third-party APIs (`dnd5eapi.ts`, `open5e.ts`) — distinct from `RequestManager`, which talks to this repo's own API.

## Environment configuration

- Frontend: copy `fargopolis-web/.env.example` to `.env`; requires `VITE_API_URL` (the deployed `HttpApiUrl`, no trailing slash) and `VITE_CLERK_PUBLISHABLE_KEY`.
- Infrastructure: `context.clerk.jwtIssuer` in `infrastructure/cdk.json` configures the authorizer. Optional custom API domain config (`apiDomain`) is deliberately **not** committed — supply it via gitignored `infrastructure/cdk.context.json`, the `CDK_API_DOMAIN_JSON` GitHub secret, or a `-c` flag; see `infrastructure/README.md` for the exact shape.
- GitHub Actions deploys assume IAM roles via OIDC (no long-lived AWS keys). Frontend and API deploys use **different** role ARNs (`AWS_ROLE_TO_ASSUME` vs `AWS_API_DEPLOY_ROLE_TO_ASSUME`) — see `infrastructure/README.md` § "GitHub Actions OIDC roles" for bootstrap/troubleshooting.

## OpenSpec workflow

This repo uses [OpenSpec](openspec/) (`schema: spec-driven`, config at `openspec/config.yaml`) for spec-driven changes, exposed via slash commands (`/opsx:propose`, `/opsx:apply`, `/opsx:update`, `/opsx:sync`, `/opsx:archive`, `/opsx:explore`) and matching skills. Completed changes are archived under `openspec/changes/archive/`.

## Reference docs

- [`infrastructure/README.md`](infrastructure/README.md) — full CDK stack/construct breakdown, Clerk config, custom domain setup, OIDC bootstrap and debugging.
- [`fargopolis-web/README.md`](fargopolis-web/README.md) — frontend env vars and API call conventions.
- [`recipes_dnd_migration.plan.md`](recipes_dnd_migration.plan.md) — historical migration record for recipes/DnD verticals.
- [`post_migration_cleanup.plan.md`](post_migration_cleanup.plan.md) — open follow-on cleanup items.
