# Fargopolis CDK (AWS)

TypeScript [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html) app that provisions API and frontend resources. The entry point is [`bin/recipes-infra.ts`](bin/recipes-infra.ts).

## Stacks

| Stack id | Purpose |
| -------- | ------- |
| **`FargopolisApi`** | HTTP API (API Gateway v2), DynamoDB, Python Lambdas (bounties, recipes, and DnD). |
| **`FargopolisFrontend`** | Private S3 + CloudFront (OAC) for the Vite SPA build — **not** the same bucket as user file uploads. |

List stacks: `npx cdk list`. Deploy one stack: `npx cdk deploy FargopolisApi` (or `FargopolisFrontend`). Add [`--profile`](#using-a-named-aws-profile) (or set `AWS_PROFILE`) whenever you are not using the default credentials.

### Dev stage deploy

Pass `-c tag=dev` (e.g. `npx cdk list -c tag=dev`) to target a second, parallel pair of
stacks — `FargopolisApi-dev` / `FargopolisFrontend-dev` — that can coexist with the default
`FargopolisApi` / `FargopolisFrontend` stacks in the same AWS account. `-c tag=<anything>` is a
generic string context value (not a special-cased boolean); `dev` is only ever hardcoded at the
Makefile level, via the `deploy-dev*` targets below. Without the flag, stack IDs and behavior are
unchanged from today.

From the repo root, use `make deploy-dev` (runs `deploy-dev-api`, `deploy-dev-web`, then
`deploy-dev-content`) and `make deploy-prod` (runs `deploy-api`, `deploy-web`, then
`deploy-prod-content`) as one-command shortcuts — each now deploys **both** the infra stacks
**and** builds/syncs/invalidates the frontend content in one command (see "Makefile frontend
content deploy" below). With `tag`, `FargopolisFrontend-dev`/`FargopolisApi-dev` have no
deploy-order dependency on each other (there is no cross-stack CloudFormation reference between
them); `npx cdk deploy --all -c tag=dev` is safe.

Operational notes specific to the dev stacks:

- **`apiDomain`** is still one custom domain per deploy — never reuse the same `apiDomain` value
  across the default stack and the dev stack; both would try to claim the same custom domain
  name / Route 53 record. The simplest safe default is to **omit `apiDomain` for the dev API
  stack** (it deploys fine on the plain `execute-api` URL) unless a second domain/certificate has
  actually been provisioned for dev.
- **`frontendDomain`** is optional for a dev deploy — see [`frontendDomain` custom domain](#frontenddomain-custom-domain)
  below. If omitted, `FargopolisFrontend-dev` still deploys fine on its raw CloudFront domain, but
  cross-origin calls from the dev web app to the dev API will fail CORS until `frontendDomain` is
  configured (its resolved `domainName` is what gets added to the API's CORS `allowOrigins`).
  The easy way for tagged stacks is **`tagDomain`** (see [Tagged subdomains](#tagged-subdomains-tagdomain)),
  which gives every `-c tag=<tag>` deploy `<tag>.fargopolis.com` automatically.
- **Never** pass `-c bootstrapGithubActionsOidcProvider=true` (or `githubActions.createOidcProvider`)
  on the dev API stack — the GitHub Actions IAM OIDC identity provider is an account-wide
  singleton already created by the original bootstrap; attempting to create it again fails.
- **Destroying the dev stacks** (`cdk destroy FargopolisApi-dev` / `FargopolisFrontend-dev`)
  leaves their DynamoDB tables (one per domain construct) and the user-uploads S3 bucket behind:
  every data construct uses `RemovalPolicy.RETAIN` (and the uploads bucket also sets
  `autoDeleteObjects: false`), unchanged for both the default and dev stacks by this feature.
  Capture the auto-generated resource names first (e.g. `aws cloudformation
  list-stack-resources --stack-name FargopolisApi-dev`) and delete them manually if the dev
  environment is being fully decommissioned.

## API stack (`FargopolisApi`)

- **[`FargopolisApiStack`](lib/stacks/fargopolis-api-stack.ts)** composes:
  - **[`BountiesConstruct`](lib/constructs/bounties-construct.ts)** — DynamoDB tables for bounty categories and bounties.
  - **[`RecipesConstruct`](lib/constructs/recipes-construct.ts)** — DynamoDB table for recipe documents (ingredients/steps nested).
  - **[`DndConstruct`](lib/constructs/dnd-construct.ts)** — DynamoDB table for character-centric DnD documents (resources, known spells, weapons, abilities nested).
  - **[`PythonSharedLayerConstruct`](lib/constructs/python-shared-layer-construct.ts)** — shared `infrastructure/lambdas/shared` code and wheels for Python 3.12 / arm64 handlers.
  - **[`ClerkHttpAuthorizerConstruct`](lib/constructs/clerk-http-authorizer-construct.ts)** — default HTTP API authorizer: verifies Clerk-issued JWTs (issuer from context).
  - **[`FargopolisHttpApiConstruct`](lib/constructs/fargopolis-http-api-construct.ts)** — shared **HTTP API** with CORS; all Lambda-backed routes use this same base URL.
  - **[`BountiesApiRoutesConstruct`](lib/constructs/bounties-api-routes-construct.ts)** — bounties Lambda and routes (reference pattern for the next verticals).
  - **[`FilesApiRoutesConstruct`](lib/constructs/files-api-routes-construct.ts)** — dedicated files/uploads Lambda for S3 presigned PUT + file URL reads (`GET /api/fileUrl/{fileId}`, `POST /api/files/presignPut`).
  - **[`RecipesApiRoutesConstruct`](lib/constructs/recipes-api-routes-construct.ts)** — recipes Lambda + HTTP routes for recipe CRUD and related reads.
  - **[`DndApiRoutesConstruct`](lib/constructs/dnd-api-routes-construct.ts)** — DnD Lambda + parity routes for characters/resources/abilities/weapons/known spells.
- **[`FargopolisBucketConstruct`](lib/constructs/fargopolis-bucket-construct.ts)** — private **user-uploads S3** (recipe avatars, DnD files, etc.). Not the Vite/CloudFront site bucket. CDK **creates** the bucket (S3-managed encryption, block public access, CORS for browser presigned PUT/GET, `RemovalPolicy.RETAIN`). Optional **`uploadsBucket.corsAllowedOrigins`** in context; default `['*']`.

**Outputs (CloudFormation):** `HttpApiUrl`, `BountyCategoriesTableName`, `BountiesTableName`, `RecipesTableName`, `DndCharactersTableName`, `FilesTableName`, **`FargopolisBucket`**. The SPA and CI bake **`VITE_API_URL`** = `HttpApiUrl` (no trailing slash) for Lambda API calls.

### User-uploads bucket: IAM and presigned URLs

- **Name in AWS / CI:** stack output **`FargopolisBucket`** (the bucket name string).
- **Lambdas** that mint presigned URLs or manage upload metadata should set **`UPLOADS_BUCKET_ENV_NAME`** (the env var name pointer, e.g. `FARGOPOLIS_UPLOADS_BUCKET_NAME`) and set that concrete env var to `props.uploadsBucket.bucket.bucketName`; then call **`userUploads.grantReadWrite(lambdaFunction)`** for object permissions. Default GET presign TTL is **15 minutes**.
- **Object keys:** use **`{uuId}_{filename}`** so existing objects and Dynamo metadata stay aligned.
- **Browser upload flow:** API returns a presigned **PUT** URL and `Content-Type`; the SPA **`PUT`**s the file to S3 with **exactly** that `Content-Type` (required for SigV4). Downloads use a presigned **GET** URL.
- **Dedicated files Lambda:** S3 IAM is intentionally concentrated in [`FilesApiRoutesConstruct`](lib/constructs/files-api-routes-construct.ts); recipe/dnd handlers can stay bucket-agnostic and call files routes instead.

### Clerk JWT issuer

JWT verification for **mutations** is configured in [`cdk.json`](cdk.json) under `context.clerk.jwtIssuer` (Clerk “Frontend API URL” / issuer). The authorizer Lambda receives this at deploy time. Update the value when you change Clerk instances; then redeploy `FargopolisApi`.

### API custom domain

`FargopolisApiStack` provisions a custom domain from CDK **`context.apiDomain`**. The field is optional — omit it and the stack deploys without a custom domain, using the raw `execute-api` URL.

Config is intentionally **not committed** to [`cdk.json`](cdk.json) (contains account IDs / ARNs). Supply it one of three ways:

| Where | Format | When to use |
| ----- | ------ | ----------- |
| **`cdk.context.json`** (gitignored) | `{ "apiDomain": { … } }` | Local deploys |
| **`CDK_API_DOMAIN_JSON`** GitHub secret | Single-line JSON of the inner object | CI / GitHub Actions |
| **`-c` flag** | `-c ‘apiDomain={"domainName":…}’` | One-off or scripted runs |

**`cdk.context.json`** shape (top-level key, no `"context"` wrapper):

```json
{
  "apiDomain": {
    "domainName": "api.example.com",
    "hostedZoneDomain": "example.com",
    "hostedZoneId": "Z1234567890ABC",
    "certificateArn": "arn:aws:acm:us-east-2:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "createDnsRecord": true
  }
}
```

**`CDK_API_DOMAIN_JSON`** secret value (inner object only, single line):

```
{"domainName":"api.example.com","hostedZoneDomain":"example.com","hostedZoneId":"Z1234567890ABC","certificateArn":"arn:aws:acm:us-east-2:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx","createDnsRecord":true}
```

Field notes:

- `certificateArn` must be in the **same region** as the HTTP API (`FargopolisApi` stack region).
- `domainName` is the API hostname clients use.
- `hostedZoneDomain` is the Route 53 public zone root (e.g. `example.com`).
- `hostedZoneId` is that zone’s ID (from Route 53 or `list-hosted-zones-by-name`). Required when `createDnsRecord` is true.
- Set `createDnsRecord: false` if DNS is managed outside Route 53 (CDK still creates API Gateway domain + mapping).

### `frontendDomain` custom domain

`FrontendStack` provisions a custom domain from CDK **`context.frontendDomain`**. The field is optional — omit it and the stack deploys without a custom domain, using the raw CloudFront domain (e.g. `d1234abcd.cloudfront.net`).

**Contrast with `apiDomain`:** the ACM certificate for `frontendDomain` must be issued in **`us-east-1`**, regardless of which region `FargopolisFrontend` itself deploys to — CloudFront is a global service and only accepts certificates from `us-east-1`. This is the **opposite** of `apiDomain`'s certificate, which must be in the **same region** as the API Gateway. CDK does **not** enforce this at synth time (`acm.Certificate.fromCertificateArn` accepts any region); a non-`us-east-1` cert ARN will only fail at CloudFormation deploy time, so this is a documentation-only guard — double-check the ARN's region before deploying.

Config is intentionally **not committed** to [`cdk.json`](cdk.json), the same three ways as `apiDomain`:

| Where | Format | When to use |
| ----- | ------ | ----------- |
| **`cdk.context.json`** (gitignored) | `{ "frontendDomain": { … } }` | Local deploys |
| **A repo/CI secret** passed as `-c` | Single-line JSON of the inner object | CI / GitHub Actions |
| **`-c` flag** | `-c ‘frontendDomain={"domainName":…}’` | One-off or scripted runs (e.g. `make deploy-dev`) |

**`cdk.context.json`** shape (top-level key, no `"context"` wrapper):

```json
{
  "frontendDomain": {
    "domainName": "dev.fargopolis.com",
    "hostedZoneDomain": "fargopolis.com",
    "hostedZoneId": "Z1234567890ABC",
    "certificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "createDnsRecord": true
  }
}
```

Field notes:

- `certificateArn` must be in **`us-east-1`** — not the stack's own deploy region (contrast with `apiDomain`, same-region-as-API-Gateway).
- `domainName` is the hostname the SPA is served on (e.g. `dev.fargopolis.com`), and — when configured — is also added as a 6th literal entry to `FargopolisApiStack`'s CORS `allowOrigins` (as `https://<domainName>`), since it's resolved once at `cdk synth` time and passed between the two stacks in-process (no cross-stack CloudFormation reference needed).
- `hostedZoneDomain` is the Route 53 public zone root (e.g. `fargopolis.com`).
- `hostedZoneId` is that zone's ID. Required when `createDnsRecord` is true.
- Set `createDnsRecord: false` if DNS is managed outside Route 53 (CDK still attaches the alias/certificate to the CloudFront distribution).

Omitting `frontendDomain` on a dev deploy is supported — `FargopolisFrontend-dev` still deploys on its raw CloudFront domain — but cross-origin calls from the dev web app to the dev API will fail CORS until it's configured, mirroring `apiDomain`'s own "omit it, deploy without the domain" fallback.

#### Tagged subdomains (`tagDomain`)

Instead of a separate `frontendDomain` per tag, supply one **`context.tagDomain`** and every tagged
deploy (`-c tag=<tag>`) gets `<tag>.<baseDomain>` (e.g. `dev.fargopolis.com`). Both stacks derive the
same name from the tag: the frontend stack adds the CloudFront alias and Route 53 record, and the API
stack adds `https://<tag>.<baseDomain>` to CORS. An explicit `frontendDomain` still wins, and untagged
(prod) deploys ignore `tagDomain`.

```json
{
  "tagDomain": {
    "baseDomain": "fargopolis.com",
    "hostedZoneId": "Z0123456789ABCDEFGHIJ",
    "certificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/…"
  }
}
```

- `certificateArn` must be a **`us-east-1`** wildcard certificate for `*.<baseDomain>`, so one
  certificate covers every tag.
- The tag must be a valid DNS label (lowercase letters, digits, hyphens).
- Delivered like `frontendDomain`: gitignored `cdk.context.json`, or `-c 'tagDomain={…}'`.

### Python Lambda bundling

Per-function assets live under `infrastructure/lambdas/`. Shared packaging logic: [`lib/python-lambda-bundling.ts`](lib/python-lambda-bundling.ts) (picks a local Python 3.10+ for `pip install`, or Docker as fallback).

## Frontend stack (`FargopolisFrontend`)

**[`FrontendStack`](lib/stacks/frontend-stack.ts)** — SPA hosting only. `cdk deploy` provisions the S3 bucket + CloudFront distribution but does **not** build or upload the SPA itself; after deploy, sync `fargopolis-web/dist` to the output bucket and invalidate CloudFront (see repo root [README.md](../README.md) and [`.github/workflows/deploy-static-frontend.yml`](../.github/workflows/deploy-static-frontend.yml)).

**Makefile frontend content deploy:** from the repo root, `make deploy-prod`/`make deploy-dev` deploy infra **and** build/sync/invalidate the frontend content in one command — the content step is handled by `deploy-prod-content`/`deploy-dev-content`, which read the just-deployed stacks' `HttpApiUrl`/`SiteBucketName`/`CloudFrontDistributionId` outputs via `aws cloudformation describe-stacks`, build `fargopolis-web` with that `VITE_API_URL`, `aws s3 sync --delete` the build output, then `aws cloudfront create-invalidation --paths "/*"` — mirroring `.github/workflows/deploy-static-frontend.yml`. `deploy-api`/`deploy-web`/`deploy-dev-api`/`deploy-dev-web` remain infra-only (unchanged) if you want to deploy just the infra.

### GitHub Actions OIDC roles

Both stacks read `context.githubActions` (see [`cdk.json`](cdk.json)): `owner`, `repo`, `branch`.

**Trust:** deploy roles trust `repo:OWNER/REPO:*` (IAM `StringLike` on JWT `sub`), where `OWNER/REPO` must match GitHub exactly. Narrow `sub` matchers (exact ref only) commonly fail `sts:AssumeRoleWithWebIdentity` for `workflow_dispatch` or subtle claim differences; if AssumeRole stays denied after fixing the slug, redeploy the stack that owns the role and confirm GitHub secrets use the matching `GithubActions*DeployRoleArn` output.

**OIDC provider**: By default both stacks **import** `arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com` (see [`lib/github-actions-oidc.ts`](lib/github-actions-oidc.ts)).

- **Only `FargopolisApiStack`** may **create** the physical IAM OIDC IdP resource on demand; **`FargopolisFrontend` always imports** (so we never try to create the same provider twice in two stacks).
- Optional overrides: `githubActions.oidcProviderArn` — custom provider ARN.
- **Bootstrap** (IAM has no GitHub IdP yet — error *“No OpenIDConnect provider … token.actions.githubusercontent.com”*, or STS will not trust the JWT): deploy **`FargopolisApi`** **once** with bootstrap, then omit the flag afterward:

```bash
cd infrastructure
npx cdk diff FargopolisApi --profile YOUR_PROFILE -c bootstrapGithubActionsOidcProvider=true   # verify OIDC resources appear
npx cdk deploy FargopolisApi --profile YOUR_PROFILE -c bootstrapGithubActionsOidcProvider=true
```

Prefer **`-c bootstrapGithubActionsOidcProvider=true`** over nested `-c githubActions='{...}'` — nested JSON sometimes fails to apply in shells, which produces **`(no changes)`** during bootstrap. Alternate nested form: `'{"owner":"OWNER","repo":"REPO","branch":"main","createOidcProvider":true}'`.

After **[IAM identity providers](https://console.aws.amazon.com/iam/home#/identity_providers)** lists `token.actions.githubusercontent.com`, use normal deploys without the bootstrap flag. Or add the IdP [manually per GitHub/AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services).

When CDK creates the IdP resource, **`RemovalPolicy.RETAIN`** is set on the IdP construct.

**Frontend** (`FargopolisFrontend`) outputs:

- `GithubActionsDeployRoleArn` → GitHub secret `AWS_ROLE_TO_ASSUME`
- `SiteBucketName` → `STATIC_SITE_BUCKET`
- `CloudFrontDistributionId` → `CLOUDFRONT_DISTRIBUTION_ID`

**API** (`FargopolisApi`) outputs:

- `GithubActionsApiDeployRoleArn` → GitHub secret `AWS_API_DEPLOY_ROLE_TO_ASSUME`

**Optional:** **`CDK_API_DOMAIN_JSON`** repository secret — single-line JSON with `domainName`, `hostedZoneDomain`, `hostedZoneId`, `certificateArn`, `createDnsRecord`. If set, the [`deploy-api-stack` workflow](../.github/workflows/deploy-api-stack.yml) passes it via `cdk deploy -c`; if unset, the workflow deploys without a custom domain (`apiDomain` is absent from committed [`cdk.json`](cdk.json) and `cdk.context.json` is gitignored).

API deploy workflow: [`.github/workflows/deploy-api-stack.yml`](../.github/workflows/deploy-api-stack.yml).

## Bootstrap and deploy

From `infrastructure/` (after `npm ci`).

### Using a named AWS profile

The CDK CLI accepts **`--profile`** (same as the AWS CLI). Use it for **every** command that talks to AWS if you are not using the default profile:

| Command | Example |
| -------- | -------- |
| Bootstrap (once per account/region) | `npx cdk bootstrap --profile YOUR_PROFILE` |
| List stacks | `npx cdk list --profile YOUR_PROFILE` |
| Synth | `npx cdk synth --profile YOUR_PROFILE` |
| Deploy all stacks | `npx cdk deploy --all --profile YOUR_PROFILE` |
| Deploy one stack | `npx cdk deploy FargopolisApi --profile YOUR_PROFILE` |

**Alternative:** set the environment for your shell session so you do not repeat the flag:

```bash
export AWS_PROFILE=your-profile-name
npx cdk deploy --all
```

`AWS_PROFILE` and `--profile` behave the same; the flag wins if both are set. With **AWS IAM Identity Center (SSO)**, run `aws sso login --profile YOUR_PROFILE` before deploy when the session has expired.

### One-shot sequence

```bash
cd infrastructure
npm ci
npx cdk bootstrap --profile YOUR_PROFILE   # once per account/region
npx cdk deploy --all --profile YOUR_PROFILE
```

For a parallel dev environment, see [Dev stage deploy](#dev-stage-deploy) above — use
`make deploy-dev` (from the repo root) for a one-command deploy of both dev stacks and their
frontend content; `npx cdk deploy --all -c tag=dev` also works for infra alone, since there's no
cross-stack CloudFormation reference between the dev stacks.

## Adding a new vertical (pattern)

1. New DynamoDB constructs (or items in an existing design) in `lib/constructs/`.
2. New Lambda directory under `infrastructure/lambdas/<name>/` with `requirements.txt` and handler; attach **`PythonSharedLayerConstruct`** if you import `shared/`.
3. New routes construct: register integrations on the **same** `HttpApi` from `FargopolisHttpApiConstruct` (see `BountiesApiRoutesConstruct`).
4. Wire the construct into `FargopolisApiStack` and add `CfnOutput`s as needed.
5. If the vertical uses **uploads / presigned URLs**: set `UPLOADS_BUCKET_ENV_NAME` and the concrete bucket env var (for example `FARGOPOLIS_UPLOADS_BUCKET_NAME`) from `this.userUploads.bucket.bucketName`, then call **`this.userUploads.grantReadWrite(yourHandler)`** after the function is created.

See the migration record at repo root: [`../recipes_dnd_migration.plan.md`](../recipes_dnd_migration.plan.md). Post-ship follow-ons: [`../post_migration_cleanup.plan.md`](../post_migration_cleanup.plan.md).
