---
name: Post-migration cleanup
overview: "After Recipes and DnD character verticals are migrated and parity-checked: stop legacy EC2/RDS, archive recipes-web + java-recipes into a new repo, then platform hardening (custom API domain, local dev docs), consolidate fargopolis-web request methods and API-related app configuration, optional tech experiments (Go Lambdas), removal of migration-era fallbacks, and optional retirement of duplicate Java routes."
todos:
  - id: ec2-rds-shutdown
    content: "Turn off or decommission EC2 and RDS backing the legacy Spring + Postgres stack once cutover is final (no rollback window); snapshot or export if required for compliance; update runbooks/cost tags so nothing auto-starts the old tier"
    status: pending
  - id: legacy-repos-archive
    content: "Migrate recipes-web and java-recipes to a new archive repository (preserve git history via filter-repo/subtree or documented copy); add README explaining frozen reference status; remove or submodule from main Recipes repo and fix any docs/CI pointers"
    status: pending
  - id: spa-request-layer-cleanup
    content: "fargopolis-web: collapse dual-base RequestManager (VITE_API_URL cookie-session get/post vs VITE_API_GATEWAY_URL *Gateway* helpers) to gateway-only where Java routes are gone; trim vite-env, .env.example, README; remove dead callers and any providers/bootstrap still assuming two API bases"
    status: pending
  - id: api-custom-domain
    content: "Attach stable hostname to shared HttpApi (e.g. api.fargopolis.com) — ACM in API region, DomainName + ApiMapping, Route 53; update fargopolis-web + CI VITE_API_GATEWAY_URL from execute-api URL"
    status: pending
  - id: local-dev-iteration
    content: "Document dev AWS profile + VITE_API_GATEWAY_URL; optional local API mirror (FastAPI) for handler iteration; optional moto/pytest / DynamoDB Local; keep periodic cdk deploy to dev for packaging and IAM truth"
    status: pending
  - id: migration-leftovers
    content: "Remove migration-era fallback logic (e.g. mixed-client transitions); optionally enforce optimistic concurrency (version) on every mutable write path in Lambdas"
    status: pending
  - id: java-route-retirement
    content: "Optional: remove or disable Spring routes duplicated by Lambdas for Recipes + in-scope DnD; tighten or remove legacy VITE_API_URL usage in fargopolis-web when safe"
    status: pending
  - id: go-lambda-optional
    content: "Optional: one Lambda or vertical in Go (provided.al2023, arm64 bootstrap) — CDK stays TypeScript; same HttpApi/Dynamo/S3 patterns"
    status: pending
isProject: false
---

# Post-migration cleanup

Recipes and the **in-scope DnD character** vertical (data migrated, gateway strangler, parity validated) are treated as **shipped**. This plan tracks **non-blocking** follow-ons that improve ergonomics, reduce legacy surface area, or explore alternatives.

## Shut down legacy EC2 and RDS

After cutover is accepted and you no longer need instant rollback to Postgres/Java:

- **Stop or terminate** EC2 instances that only served the Spring API (or scale ASG to zero if you keep the template for emergencies).
- **Stop or delete** the RDS instance (or cluster) used by the legacy app after a final snapshot if policy requires it.
- **Billing / ops:** confirm no scheduled tasks, health checks, or CDK stacks still point at those resources; tag or document so they are not mistaken for active production.

**Todo:** `ec2-rds-shutdown`.

## Archive legacy `recipes-web` and `java-recipes` in a new repo

When the monorepo no longer needs day-to-day work on the old SPA and Spring API, **park them in a dedicated repository** so the main Recipes workspace stays focused on `fargopolis-web`, `infrastructure`, and Lambdas.

- **Scope:** always extract [`java-recipes/`](java-recipes/); include **`recipes-web/`** if it still exists in the tree, or pull the pre–`fargopolis-web` SPA tree from git history if the old app was renamed or merged.
- **Create** an empty target repo (e.g. `recipes-legacy-archive` or similar naming your org prefers).
- **History:** use `git filter-repo` (or subtree split) to extract only those paths with commit history, or document a one-time copy if history is not worth the effort.
- **README** in the new repo: state that the tree is **frozen for reference** (no production deploys), and point to the current stack (`fargopolis-web` + CDK) for active development.
- **Main repo:** delete those directories or replace with a short `LEGACY.md` link to the new repo; grep for paths and update root / infrastructure READMEs so newcomers are not sent to dead subtrees.

**Todo:** `legacy-repos-archive`.

## SPA: request methods and API-facing app configuration

Today the SPA carries **two** API bases (`VITE_API_URL` for Java + cookies vs `VITE_API_GATEWAY_URL` for Lambdas + Clerk bearer) and parallel helpers in [`fargopolis-web/src/helpers/RequestManager.ts`](fargopolis-web/src/helpers/RequestManager.ts) (`get` / `post` vs `getGateway` / `postGatewayWithAuth`, etc.). Once remaining traffic is on the gateway:

- **Route callers** through a single base URL and one set of HTTP helpers (or a thin wrapper that always targets the gateway).
- **Remove** obsolete `VITE_API_URL` usage from components, env examples, and CI where every consumed route is Lambda-backed.
- **Docs:** align [`fargopolis-web/README.md`](fargopolis-web/README.md) with the single-stack story.
- **App shell:** audit `main.tsx` / providers for assumptions about dual APIs; keep [`AppContext.tsx`](fargopolis-web/src/components/AppContext.tsx) focused on user/session state—drop any migration-only wiring tied to the Java base if present.

**Todo:** `spa-request-layer-cleanup` (often done in tandem with `java-route-retirement`).

## Custom domain on API Gateway

While Java still owns a hostname you might want to reuse, keep using the **`execute-api`…** base from **`HttpApiUrl`** to avoid collisions. After the Spring API no longer needs that hostname (or Java is hosted elsewhere):

- **CDK:** `aws_apigatewayv2.DomainName` + `ApiMapping` on the existing shared `HttpApi`; **ACM** in the **same region** as the API.
- **DNS:** Route 53 (or your DNS) alias to the API Gateway custom domain target.
- **App + CI:** set **`VITE_API_GATEWAY_URL`** to `https://api…` (no trailing slash) in env and CI secrets. Paths remain **`/api/...`**.

**Todo:** `api-custom-domain`.

## Local development

- **Profile:** named **`AWS_PROFILE`** / SSO so prod deploys are never accidental (see [`infrastructure/README.md`](infrastructure/README.md)).
- **SPA against real dev API:** `VITE_API_GATEWAY_URL` = dev stack **`HttpApiUrl`** — exercises CORS, Clerk authorizer, and real API Gateway.
- **Optional:** small local server mirroring `/api/...` routes for faster handler iteration; **pytest** + **moto** or DynamoDB Local for offline tests.
- **Reality check:** periodic **`cdk deploy`** to dev so Lambda packaging and IAM stay aligned with laptop-only workflows.

**Todo:** `local-dev-iteration` — fold anything you adopt into root [`README.md`](README.md) or [`infrastructure/README.md`](infrastructure/README.md).

## Tidy migration leftovers

- Delete **transition-only** branches (e.g. ingredient flows that accept missing `recipeId` only for old clients).
- Optionally apply **`version`** / conditional writes consistently on all mutating Lambdas (Recipes, DnD, bounties as applicable).

**Todo:** `migration-leftovers`.

## Optional Java / legacy app retirement

When the team is confident there is no rollback need:

- Remove or stop registering **duplicate** Spring controllers for routes already served by Lambdas (Recipes, in-scope DnD).
- Reduce or remove **`VITE_API_URL`** usage in `fargopolis-web` for paths that are fully on the gateway.

**Deferred DnD scope** (still on Java until explicitly scoped): glossary, custom races/traits, and any endpoint not covered by the DnD Lambda.

**Todo:** `java-route-retirement`.

## Optional: Go Lambdas

Not required for any shipped vertical. If you want a small binary or language exercise: **`provided.al2023`**, `GOOS=linux` **`GOARCH=arm64`**, `bootstrap` zip, same CDK stack and HttpApi wiring as Python handlers.

**Todo:** `go-lambda-optional`.
