# Recipes aka Fargopolis
This platform was built as a personal project to explore different technologies, manage my own recipes, gamify recurring tasks as bounties, and organize Dungeons & Dragons characters. It's also a way to showcase my work and experiment with new ideas. Feel free to explore and see what I've been working on!

## Architecture at a glance

Fargopolis is an AWS-first architecture with a **Vite** SPA frontend and a serverless API.

| Layer | What it is | Notes |
| ----- | ---------- | ----- |
| **Frontend** | **Vite SPA** in [`fargopolis-web/`](fargopolis-web/) | Built static assets are hosted via **S3 + CloudFront** in the `FargopolisFrontend` stack. |
| **API** | **API Gateway (HTTP API)** + **Python Lambdas** in [`infrastructure/`](infrastructure/) | Vertical handlers include bounties, recipes, DnD, glossary, and files/upload endpoints. |
| **Data** | **DynamoDB** tables provisioned by CDK constructs | Tables are organized by domain (bounties, recipes, DnD, files metadata). |
| **Auth** | **Clerk JWT** validation via default HTTP API authorizer | Issuer is configured in CDK context under `context.clerk.jwtIssuer`. |
| **File storage** | Private S3 bucket for user uploads | Separate from the static site bucket; upload/download flows use presigned URLs. |

## Documentation

- **[`infrastructure/README.md`](infrastructure/README.md)** — CDK stacks, constructs, auth configuration, and deployment commands.
- **[`fargopolis-web/README.md`](fargopolis-web/README.md)** — frontend setup and environment variables.
- **[`recipes_dnd_migration.plan.md`](recipes_dnd_migration.plan.md)** — historical migration record for recipes and DnD data.
- **[`post_migration_cleanup.plan.md`](post_migration_cleanup.plan.md)** — follow-on platform improvements and cleanup items.

## Machine setup

For **CDK** (`npx cdk deploy` / `npx cdk synth` in `infrastructure/`) to bundle Python Lambdas **locally** (faster than Docker), your shell needs **Python 3.10+** on `PATH` — **3.12** matches the Lambda runtime. On macOS, the Xcode **Command Line Tools** `python3` is often **3.9** and is too old for that step (pip can error while compiling some wheel sources).

- Install a current Python, e.g. `brew install python@3.12`, and follow Homebrew’s `PATH` note so **`python3.12` appears before** `/usr/bin` (or whatever provides the 3.9 build).
- No extra environment variables are required: CDK picks `python3.12` → `python3.11` → `python3.10` → `python3` in that order, using the first that reports 3.10+.
- Use `./scripts/setup-python-lambdas.sh` to create the repo **`.venv`** with that same family of interpreters; select `.venv/bin/python` in the editor for Pyright and local Lambda imports.

If nothing suitable is on `PATH`, CDK **falls back to Docker** for bundling (slower, but still works once Docker is available).

## Startup
#### Frontend (Vite SPA)
From the repo root, enable Corepack if needed (`corepack enable`), then:

```bash
cd fargopolis-web
pnpm install
cp .env.example .env
pnpm dev
```

The dev server listens on port **3000** (see `vite.config.ts`).

#### Infrastructure Python Lambdas (local editor/runtime deps)
From the repo root:

```bash
./scripts/setup-python-lambdas.sh
source .venv/bin/activate
```

Then in Cursor/VS Code, run `Python: Select Interpreter` and choose `.venv/bin/python`.

Dependency management model:
- Source of truth for deployed Python dependencies is per-lambda `requirements.txt` files:
  - `infrastructure/lambdas/bounties/requirements.txt`
  - `infrastructure/lambdas/clerk_authorizer/requirements.txt`
- `infrastructure/lambdas/requirements-dev.txt` references those same files for local development and editor type resolution, plus local-only helpers like `boto3`.
- CDK bundling in `infrastructure/lib/constructs/` installs deployment packages from each lambda's `requirements.txt`.

Adding a new Python dependency:
1. Add it to the lambda-specific `requirements.txt` file for the handler that imports it.
2. Re-sync local env:

```bash
./scripts/setup-python-lambdas.sh
source .venv/bin/activate
```

3. Deploy from the `infrastructure/` directory so CDK picks up the same dependency:

```bash
cd infrastructure
npx cdk deploy FargopolisApi --profile YOUR_PROFILE
```

Notes:
- If a package is only needed locally (editor/tests) and not in the deployed artifact, add it only to `infrastructure/lambdas/requirements-dev.txt`.
- `boto3` is currently local-only in `requirements-dev.txt` because AWS Lambda Python runtime already provides it.

## AWS: CDK static hosting (`fargopolis-web`)

Infrastructure for the Vite app lives in **`infrastructure/`**: a private S3 bucket, CloudFront (with OAC), and SPA-style error routing. The stack id is **`FargopolisFrontend`**.

### Prerequisites

- Node.js (LTS) and npm
- AWS CLI configured (`aws sts get-caller-identity` succeeds)
- IAM permissions sufficient to create the stack (bootstrap and deploy need CloudFormation plus IAM, S3, CloudFront, and related resources—or use a profile with admin/bootstrap rights)

### One-time bootstrap (per AWS account and region)

If this account/region has never been CDK-bootstrapped:

```bash
cd infrastructure
npm ci
npx cdk bootstrap
```

Use `--profile YOUR_PROFILE` if you rely on named credentials. Bootstrap only needs to succeed once per account/region.

### Deploy or update the stack

```bash
cd infrastructure
npm ci
npx cdk deploy
```

With a named profile:

```bash
npx cdk deploy --profile YOUR_PROFILE
```

After a successful deploy, note the CloudFormation **Outputs**: **SiteBucketName**, **CloudFrontDistributionId**, and **SiteUrl**. Upload the Vite build to the bucket and invalidate CloudFront (see `.github/workflows/deploy-static-frontend.yml` for the CI workflow using repo secrets).

## CI/CD notes (OIDC)

GitHub Actions AWS auth is managed with CDK-provisioned OIDC roles (no long-lived AWS access keys in repo secrets):
- Frontend static deploy workflow uses `AWS_ROLE_TO_ASSUME` (from `FargopolisFrontend` output `GithubActionsDeployRoleArn`).
- API CDK deploy workflow uses `AWS_API_DEPLOY_ROLE_TO_ASSUME` (from `FargopolisApi` output `GithubActionsApiDeployRoleArn`).
- Both workflows also use `AWS_REGION`.
