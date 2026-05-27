---
name: Post-migration cleanup
overview: "After Recipes and DnD character verticals are migrated and parity-checked: platform hardening (custom API domain, local dev docs), optional tech experiments (Go Lambdas), and removal of migration-era fallbacks."
todos:
  - id: api-custom-domain
    content: "Attach stable hostname to shared HttpApi (e.g. api.fargopolis.com) — ACM in API region, DomainName + ApiMapping, Route 53; update fargopolis-web + CI VITE_API_URL from execute-api URL"
    status: done
  - id: local-dev-iteration
    content: "Document dev AWS profile + VITE_API_URL; optional local API mirror (FastAPI) for handler iteration; optional moto/pytest / DynamoDB Local; keep periodic cdk deploy to dev for packaging and IAM truth"
    status: pending
  - id: migration-leftovers
    content: "Remove migration-era fallback logic (e.g. mixed-client transitions); optionally enforce optimistic concurrency (version) on every mutable write path in Lambdas"
    status: pending
  - id: go-lambda-optional
    content: "Optional: one Lambda or vertical in Go (provided.al2023, arm64 bootstrap) — CDK stays TypeScript; same HttpApi/Dynamo/S3 patterns"
    status: pending
  - id: api-domain-cdk-context-public-repo
    content: "Public repo hygiene: drop account-specific apiDomain from tracked infrastructure/cdk.json; use GitHub secret CDK_API_DOMAIN_JSON (+ optional docs for local -c overrides); purge ARNs/account ids from git history only if warranted"
    status: done
isProject: false
---

# Post-migration cleanup

Recipes and the **in-scope DnD character** vertical (data migrated, gateway strangler, parity validated) are treated as **shipped**. This plan tracks **non-blocking** follow-ons that improve ergonomics, reduce legacy surface area, or explore alternatives.

## Local development

- **Profile:** named **`AWS_PROFILE`** / SSO so prod deploys are never accidental (see [`infrastructure/README.md`](infrastructure/README.md)).
- **SPA against real dev API:** `VITE_API_URL` = dev stack **`HttpApiUrl`** — exercises CORS, Clerk authorizer, and real API Gateway.
- **Optional:** small local server mirroring `/api/...` routes for faster handler iteration; **pytest** + **moto** or DynamoDB Local for offline tests.
- **Reality check:** periodic **`cdk deploy`** to dev so Lambda packaging and IAM stay aligned with laptop-only workflows.

**Todo:** `local-dev-iteration` — fold anything you adopt into root [`README.md`](README.md) or [`infrastructure/README.md`](infrastructure/README.md).

## Tidy migration leftovers

- Delete **transition-only** branches (e.g. ingredient flows that accept missing `recipeId` only for old clients).
- Optionally apply **`version`** / conditional writes consistently on all mutating Lambdas (Recipes, DnD, bounties as applicable).

**Todo:** `migration-leftovers`.

## Optional: Go Lambdas

Not required for any shipped vertical. If you want a small binary or language exercise: **`provided.al2023`**, `GOOS=linux` **`GOARCH=arm64`**, `bootstrap` zip, same CDK stack and HttpApi wiring as Python handlers.

**Todo:** `go-lambda-optional`.
