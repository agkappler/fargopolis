## Why

The Python Lambdas have no test suite — `infrastructure/lambdas/` is only type-checked (`pyrightconfig.json`), never exercised. The only way to verify a handler change today is `cdk deploy` against the real (prod-shared) API and DynamoDB tables, which is slow and puts every backend change one keystroke away from touching production data. That makes AI-driven changes to Lambda logic (this repo's primary dev loop right now) hard to self-verify: there's no fast, deterministic feedback signal before a human has to deploy and click around.

## What Changes

Pure test-tooling addition — no user-facing behavior, routes, or API contracts change.

- Add `pytest` + `moto` (DynamoDB mocking) to `infrastructure/lambdas/requirements-dev.txt` so tests never hit real AWS tables.
- Add `infrastructure/lambdas/pytest.ini` (or `pyproject.toml` `[tool.pytest.ini_options]`) configuring `rootdir`/`testpaths` and making `shared` importable the same way CDK bundling and `pyrightconfig.json` already resolve it.
- Add `infrastructure/lambdas/bounties/tests/conftest.py` with a moto-backed DynamoDB fixture that creates the `BOUNTIES_TABLE_NAME` / `BOUNTY_CATEGORIES_TABLE_NAME` tables (matching the real key schema in [bounties-construct.ts](../../../infrastructure/lib/constructs/bounties-construct.ts)) and sets the corresponding env vars, plus a helper for building minimal API Gateway HTTP API v2 event payloads (with/without an authenticated Clerk authorizer context).
- Add `infrastructure/lambdas/bounties/tests/test_handler.py` covering `handler()`'s routes: `GET /api/bounties`, `GET /api/bountyCategories`, `POST /api/createBounty`, `POST /api/updateBounty`, `POST /api/createBountyCategory` — including the 401 (unauthenticated write), 400 (validation/bad JSON), 404 (unknown route, update of a missing bounty), and status-normalization behavior already implemented in `handler.py`.
- Document the pattern (how to run tests, how fixtures mock DynamoDB, how to extend to another vertical) in `infrastructure/lambdas/README.md` (new file) so it's reusable for `camping`, `recipes`, `dnd`, `dnd_glossary`, `files`, and `clerk_authorizer` later — but do not write those other verticals' tests in this change.
- Add a `test` script/entry to `infrastructure/package.json` (or a `scripts/` helper) so `pytest` runs with one command, matching the existing `./scripts/setup-python-lambdas.sh` convention.

Explicitly **not** in scope: CDK `assertions` tests, frontend tests, or test coverage for verticals other than `bounties`.

## Capabilities

### New Capabilities
_None — this is test/tooling infrastructure, not a product capability. `skip_specs: true` is set in `.openspec.yaml`._

### Modified Capabilities
_None._

## Impact

- **Code:** `infrastructure/lambdas/requirements-dev.txt` (add `pytest`, `moto[dynamodb]`); new `infrastructure/lambdas/pytest.ini`; new `infrastructure/lambdas/bounties/tests/__init__.py`, `conftest.py`, `test_handler.py`; new `infrastructure/lambdas/README.md`.
- **Dependencies:** adds `pytest` and `moto` as local dev-only dependencies (not shipped in the Lambda bundle — same treatment as `boto3` in `requirements-dev.txt` today).
- **Build/test gates:** adds a new, currently-nonexistent gate — `pytest` run from `infrastructure/lambdas/` (or via a package.json script) — alongside the existing `tsc --noEmit`/`eslint`/`cdk synth` gates. Does not change CI (no CI wiring in this change; can follow later).
- **No infra/runtime impact:** no CDK, DynamoDB, or deployed Lambda changes.
